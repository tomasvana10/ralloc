import uWS from "uWebSockets.js";
import { getSessionFromCookie } from "@core/auth/utils";
import { rateLimit } from "@core/db/rate-limit";
import * as GSServer from "@core/lib/group-session/proto/server";
import { getLogger } from "@core/logger";
import { handleMessage } from "./handlers/message";
import { Room } from "./room";
import { doSafeSync } from "./utils";

export interface UserData {
  code: string;
  userId: string;
  isHost: boolean;
  room: Room;
  state: ClientState;
  pingInterval: ReturnType<typeof setInterval> | null;
}

export interface ClientState {
  lastSync: number;
  successfulResponses: number;
  isPonging: boolean;
  rateLimits: number;
}

function createClientState(): ClientState {
  return {
    lastSync: 0,
    successfulResponses: 0,
    isPonging: true,
    rateLimits: 0,
  };
}

const log = getLogger("wsServer");
const logd = getLogger("wsServerDebugger");

const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) throw new Error("auth secret must be set");

const env = {
  PORT: parseInt(process.env.WS_PORT ?? "6767", 10),
  HOST: process.env.WS_HOST ?? "0.0.0.0",
  AUTH_SECRET,
} as const;

const app = uWS.App();
let listenSocket: uWS.us_listen_socket | null = null;

app.ws<UserData>("/:code", {
  maxPayloadLength: GSServer.MSG_SIZE_LIMIT,
  upgrade: async (res, req, context) => {
    const code = req.getParameter(0);
    const cookie = req.getHeader("cookie");
    const secWebSocketKey = req.getHeader("sec-websocket-key");
    const secWebSocketProtocol = req.getHeader("sec-websocket-protocol");
    const secWebSocketExtensions = req.getHeader("sec-websocket-extensions");

    let aborted = false;
    res.onAborted(() => {
      aborted = true;
    });

    if (!code) {
      if (!aborted) {
        res.cork(() => {
          res.writeStatus("400 Bad Request").end("no session code");
        });
      }
      return;
    }

    const session = await getSessionFromCookie(cookie, AUTH_SECRET);

    if (!session) {
      if (!aborted) {
        res.cork(() => {
          res.writeStatus("401 Unauthorized").end("invalid session");
        });
      }
      return;
    }

    const userId = session.id;

    const rl = await rateLimit({
      id: userId,
      categories: ["ws", "UPGRADE"],
      requestsPerMinute: 12,
      burst: 5,
    });

    if (rl.res) {
      if (!aborted) {
        res.cork(() => {
          res.writeStatus("429 Too Many Requests").end("Rate limited");
        });
      }
      return;
    }

    const room = await Room.get(code);

    if (!room) {
      if (!aborted) {
        res.cork(() => {
          res.writeStatus("404 Not Found").end("Room not found");
        });
      }
      return;
    }

    if (aborted) return;

    const isHost = room.hostId === userId;

    logd.debug(`[${code}] upgrading (host: ${isHost}, user: ${userId})`);

    const userData: UserData = {
      code,
      userId,
      isHost,
      room,
      state: createClientState(),
      pingInterval: null,
    };

    res.cork(() => {
      res.upgrade(
        userData,
        secWebSocketKey,
        secWebSocketProtocol,
        secWebSocketExtensions,
        context,
      );
    });
  },
  open: async (ws) => {
    const userData = ws.getUserData();
    const { code, room } = userData;

    logd.debug(`[${code}] client connected (is host: ${userData.isHost})`);

    const synced = await doSafeSync(room, code, ws);
    if (!synced) return;

    room.onClientOpen(ws);

    userData.pingInterval = setInterval(() => {
      if (!userData.state.isPonging) {
        ws.close();
        return;
      }
      userData.state.isPonging = false;
      ws.ping();
    }, GSServer.PING_INTERVAL_MS);
  },
  pong: (ws) => {
    ws.getUserData().state.isPonging = true;
  },
  message: async (ws, message) => {
    await handleMessage(ws, message);
  },
  close: (ws, code) => {
    const userData = ws.getUserData();

    logd.debug(`[${userData.code}] client disconnected (code: ${code})`);

    if (userData.pingInterval) clearInterval(userData.pingInterval);

    userData.room.onClientClose(ws);
  },
});

app.listen(env.HOST, env.PORT, (sock) => {
  if (sock) {
    listenSocket = sock;
    log.info(`listening on ${env.HOST}:${env.PORT}`);
  } else {
    log.error(`failed to listen on ${env.HOST}:${env.PORT}`);
    process.exit(1);
  }
});

function shutdown() {
  log.info("shutting down...");

  if (listenSocket) {
    uWS.us_listen_socket_close(listenSocket);
    listenSocket = null;
    log.info("listen socket closed.");
  }

  log.info("full shutdown complete");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

import { groupSessionRooms } from "@/app/api/session-ws/[code]/room";
import { auth } from "@/auth";
import {
  deleteGroupSession,
  doesGroupSessionExist,
  getGroupSessionByCode,
  getHostId,
  paths,
  updateGroupSession,
} from "@/db/group-session";
import { rateLimit } from "@/db/rate-limit";
import { redisPub } from "@/db/redis";
import { sessionCreateSchema } from "@/features/forms/session-create";
import { GroupSessionS2C } from "@/lib/group-session/messaging";
import { getZodSafeParseErrorResponse } from "@/lib/utils";

type Params = Promise<{ code: string }>;

export async function DELETE(_: Request, { params }: { params: Params }) {
  const { code } = await params;
  const session = (await auth())!;
  const userId = session.user.id;

  const { rheaders, res } = await rateLimit(
    userId,
    ["sessions/[code]", "POST"],
    115,
    17,
  );
  if (res) return res;

  const hostId = await getHostId(code);
  if (userId !== hostId) return rheaders(new Response(null, { status: 403 }));

  const gs = groupSessionRooms.get(code);
  if (gs) gs.stale = true;

  await deleteGroupSession(hostId, code);
  redisPub.publish(paths.pubsub.deleted(code), "");
  return rheaders(new Response(null, { status: 204 }));
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { code } = await params;
  const session = (await auth())!;
  const userId = session.user.id;

  const { rheaders, res } = await rateLimit(
    session.user.id,
    ["sessions/[code]", "SHARED"],
    115,
    17,
  );
  if (res) return res;

  const hostId = await getHostId(code);
  if (userId !== hostId) return rheaders(new Response(null, { status: 403 }));

  const body = await req.json();
  const parseResult = sessionCreateSchema.partial().strict().safeParse(body);

  if (!parseResult.success)
    return rheaders(getZodSafeParseErrorResponse(parseResult));

  if (!Object.keys(body).length)
    return rheaders(
      Response.json(
        { error: { message: "No data provided" } },
        { status: 400 },
      ),
    );

  await updateGroupSession(parseResult.data, hostId, code);

  // publishing just the raw data is inefficient, as the websocket handler will
  // have to parse it, assemble its own payload, then stringify it. this way, all
  // they have to do is send it (and parse it to update their own cache)
  const syncPayload: GroupSessionS2C.Payloads.Synchronise = {
    code: GroupSessionS2C.Code.Synchronise,
    data: (await getGroupSessionByCode(code))!,
  };
  redisPub.publish(paths.pubsub.newData(code), JSON.stringify(syncPayload));
  return rheaders(new Response());
}

export async function HEAD(_: Request, { params }: { params: Params }) {
  const { code } = await params;

  const exists = await doesGroupSessionExist(code);

  return new Response(null, {
    status: exists ? 200 : 404,
  });
}

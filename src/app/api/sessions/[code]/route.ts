import { groupSessionRooms } from "@/app/api/session-ws/[code]/room";
import { auth } from "@/auth";
import { redisPub } from "@/db";
import {
  deleteGroupSession,
  doesGroupSessionExist,
  getGroupSessionByCode,
  getGroupSessionGroupSize,
  getHostId,
  paths,
  updateGroupSession,
} from "@/db/group-session";
import { rateLimit } from "@/db/rate-limit";
import {
  baseSessionEditSchema,
  sessionEditSchemaFactory,
} from "@/features/forms/session-edit/schema";
import { GSServer } from "@/lib/group-session/proto";
import { getZodSafeParseErrorResponse } from "@/lib/utils";

type Params = Promise<{ code: string }>;

export async function DELETE(_: Request, { params }: { params: Params }) {
  const { code } = await params;
  const session = (await auth())!;
  const userId = session.user.id;

  const { infoHeaders, res } = await rateLimit({
    id: userId,
    categories: ["sessions/[code]", "POST"],
    requestsPerMinute: 80,
    burst: 15,
  });
  if (res) return res;

  const hostId = await getHostId(code);
  if (!hostId) return infoHeaders(new Response(null, { status: 404 }));
  if (userId !== hostId)
    return infoHeaders(new Response(null, { status: 403 }));

  const gs = groupSessionRooms.get(code);
  if (gs) gs.stale = true;

  await deleteGroupSession(hostId, code);
  redisPub.publish(paths.pubsub.deleted(code), "");
  return infoHeaders(new Response(null, { status: 204 }));
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { code } = await params;
  const session = (await auth())!;
  const userId = session.user.id;

  const { infoHeaders, res } = await rateLimit({
    id: session.user.id,
    categories: ["sessions/[code]", "SHARED"],
    requestsPerMinute: 80,
    burst: 15,
  });
  if (res) return res;

  const hostId = await getHostId(code);
  if (!hostId) return infoHeaders(new Response(null, { status: 404 }));
  if (userId !== hostId)
    return infoHeaders(new Response(null, { status: 403 }));

  const body = await req.json().catch(() => null);
  if (!body) return new Response(null, { status: 400 });

  if (!Object.keys(body).length)
    return infoHeaders(
      Response.json(
        { error: { message: "No data provided" } },
        { status: 400 },
      ),
    );

  const hasGroupSizeProperty = "groupSize" in body;
  const sessionEditSchema = hasGroupSizeProperty
    ? sessionEditSchemaFactory(
        +((await getGroupSessionGroupSize(hostId, code)) || 0),
        true,
      )
    : baseSessionEditSchema.partial().strict();
  const parseResult = sessionEditSchema.safeParse(body);

  if (!parseResult.success)
    return infoHeaders(getZodSafeParseErrorResponse(parseResult));

  await updateGroupSession(parseResult.data, hostId, code);

  // publishing just the raw data is inefficient, as the websocket handler will
  // have to parse it, assemble its own payload, then stringify it. this way, all
  // they have to do is send it (and parse it to update their own cache)
  const syncPayload: GSServer.Payloads.Synchronise = {
    code: GSServer.Code.Synchronise,
    data: (await getGroupSessionByCode(code))!,
  };
  redisPub.publish(paths.pubsub.newData(code), JSON.stringify(syncPayload));
  return infoHeaders(new Response());
}

export async function HEAD(_: Request, { params }: { params: Params }) {
  const { code } = await params;

  const exists = await doesGroupSessionExist(code);

  return new Response(null, {
    status: exists ? 200 : 404,
  });
}

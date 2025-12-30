import { redisPub } from "@core/db";
import {
  deleteGroupSession,
  doesGroupSessionExist,
  getGroupSessionGroupSize,
  getHostId,
  paths,
  updateGroupSession,
} from "@core/db/group-session";
import { rateLimit } from "@core/db/rate-limit";
import { GSServer } from "@core/lib/group-session/proto";
import {
  baseSessionEditSchema,
  sessionEditSchemaFactory,
} from "@core/schema/group-session/edit";
import { auth } from "@web/auth";
import { getZodSafeParseErrorResponse } from "@web/lib/utils";

type Context = RouteContext<"/api/sessions/[code]">;

export async function DELETE(_: Request, { params }: Context) {
  const { code } = await params;
  const session = (await auth())!;
  const userId = session.user.id;

  const { withRateLimitHeaders, res } = await rateLimit({
    id: userId,
    categories: ["sessions/[code]", "SHARED"],
    requestsPerMinute: 80,
    burst: 15,
  });
  if (res) return res;

  const hostId = await getHostId(code);
  if (!hostId) return withRateLimitHeaders(new Response(null, { status: 404 }));
  if (userId !== hostId)
    return withRateLimitHeaders(new Response(null, { status: 403 }));

  //RoomManager.markAsStale(code);

  await deleteGroupSession(hostId, code);
  redisPub.publish(paths.pubsub.deleted(code), "");
  return withRateLimitHeaders(new Response(null, { status: 204 }));
}

export async function PATCH(req: Request, { params }: Context) {
  const { code } = await params;
  const session = (await auth())!;
  const userId = session.user.id;

  const { withRateLimitHeaders, res } = await rateLimit({
    id: session.user.id,
    categories: ["sessions/[code]", "SHARED"],
    requestsPerMinute: 80,
    burst: 15,
  });
  if (res) return res;

  const hostId = await getHostId(code);
  if (!hostId) return withRateLimitHeaders(new Response(null, { status: 404 }));
  if (userId !== hostId)
    return withRateLimitHeaders(new Response(null, { status: 403 }));

  const body = await req.json().catch(() => null);
  if (!body) return new Response(null, { status: 400 });

  if (!Object.keys(body).length)
    return withRateLimitHeaders(
      Response.json(
        { error: { message: "No data provided" } },
        { status: 400 },
      ),
    );

  const hasGroupSizeProperty = "groupSize" in body;
  const sessionEditSchema = hasGroupSizeProperty
    ? sessionEditSchemaFactory(
        (await getGroupSessionGroupSize(hostId, code)) || 0,
        true,
      )
    : baseSessionEditSchema.partial().strict();
  const parseResult = sessionEditSchema.safeParse(body);

  if (!parseResult.success)
    return withRateLimitHeaders(getZodSafeParseErrorResponse(parseResult));

  await updateGroupSession(parseResult.data, hostId, code);

  // publishing just the raw data is inefficient, as the websocket handler will
  // have to parse it, assemble its own payload, then stringify it. this way, all
  // they have to do is send it (and parse it to update their own cache)
  const partialSyncPayload: GSServer.Payloads.PartialSynchronise = {
    code: GSServer.Code.PartialSynchronise,
    data: parseResult.data,
  };
  redisPub.publish(
    paths.pubsub.partialData(code),
    JSON.stringify(partialSyncPayload),
  );
  return withRateLimitHeaders(new Response());
}

export async function HEAD(_: Request, { params }: Context) {
  const { code } = await params;
  const session = (await auth())!;

  const { withRateLimitHeaders, res } = await rateLimit({
    id: session.user.id,
    categories: ["sessions", "HEAD"],
    requestsPerMinute: 70,
    burst: 20,
  });
  if (res) return res;

  const exists = await doesGroupSessionExist(code);

  return withRateLimitHeaders(
    new Response(null, {
      status: exists ? 200 : 404,
    }),
  );
}

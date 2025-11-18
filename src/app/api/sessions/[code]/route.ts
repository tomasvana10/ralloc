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
import { sessionCreateSchema } from "@/forms/session-create";
import { getZodSafeParseErrorResponse } from "@/lib/utils";

type Params = Promise<{ code: string }>;

export async function DELETE(_: Request, { params }: { params: Params }) {
  const { code } = await params;
  const session = (await auth())!;
  const userId = session.user.id;

  const { rheaders, res } = await rateLimit(
    userId,
    "SHARED@sessions/[code]",
    115,
    17,
  );
  if (res) return res;

  const hostId = await getHostId(code);
  if (userId !== hostId) return rheaders(new Response(null, { status: 403 }));

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
    "SHARED@sessions/[code]",
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
  redisPub.publish(
    paths.pubsub.patched(code),
    JSON.stringify(await getGroupSessionByCode(code)),
  );
  return rheaders(new Response());
}

export async function HEAD(_: Request, { params }: { params: Params }) {
  const { code } = await params;

  const exists = await doesGroupSessionExist(code);

  return new Response(null, {
    status: exists ? 200 : 404,
  });
}

import { auth } from "@/auth";
import {
  deleteGroupSession,
  doesGroupSessionExist,
  getGroupSessionByCode,
  getHostId,
  paths,
  updateGroupSession,
} from "@/db/group-session";
import { redisPub } from "@/db/redis";
import { sessionCreateSchema } from "@/forms/session-create";
import { getZodSafeParseErrorResponse } from "@/lib/utils";

type Params = Promise<{ code: string }>;

export async function DELETE(_: Request, { params }: { params: Params }) {
  const { code } = await params;
  const session = (await auth())!;
  const hostId = await getHostId(code);

  if (session.user.id !== hostId)
    return Response.json(
      { error: { message: "unauthorised" } },
      { status: 403 },
    );

  await deleteGroupSession(hostId, code);
  redisPub.publish(paths.pubsub.deleted(code), "");
  return Response.json({ message: "success" });
}

export async function GET(_: Request, { params }: { params: Params }) {
  const { code } = await params;
  const groupSession = await getGroupSessionByCode(code);

  if (!groupSession)
    return Response.json(
      { error: { message: "resource not found" } },
      { status: 404 },
    );

  return Response.json({ data: groupSession });
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { code } = await params;
  const session = (await auth())!;
  const hostId = await getHostId(code);

  if (session.user.id !== hostId)
    return Response.json(
      { error: { message: "unauthorised" } },
      { status: 403 },
    );

  const body = await req.json();
  const parseResult = sessionCreateSchema.partial().strict().safeParse(body);

  if (!parseResult.success) return getZodSafeParseErrorResponse(parseResult);

  if (!Object.keys(body).length)
    return Response.json(
      { error: { message: "no data provided" } },
      { status: 400 },
    );

  await updateGroupSession(parseResult.data, hostId, code);
  redisPub.publish(
    paths.pubsub.patched(code),
    JSON.stringify(await getGroupSessionByCode(code)),
  );
  return Response.json({ message: "success" });
}

export async function HEAD(_: Request, { params }: { params: Params }) {
  const { code } = await params;

  const exists = await doesGroupSessionExist(code);

  return new Response(null, {
    status: exists ? 200 : 404,
  });
}

import { auth } from "@/auth";
import {
  deleteGroupSession,
  getGroupSessionByCode,
  updateGroupSession,
} from "@/db/session";
import { getHostId } from "@/db/session/helpers";
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
  return Response.json({ message: "success" });
}

import { auth } from "@/auth";
import { deleteGroupSession, getSessionByCode } from "@/db/session";
import { getHostId } from "@/db/session/helpers";

export async function DELETE(
  _: Request,
  {
    params,
  }: {
    params: Promise<{ code: string }>;
  }
) {
  const session = (await auth())!;
  const { code } = await params;
  const hostId = await getHostId(code);

  if (session.user.id !== hostId)
    return Response.json({ message: "unauthorised" }, { status: 403 });

  await deleteGroupSession(hostId, code);
  return Response.json({ message: "success" });
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await getSessionByCode(code);

  if (!session)
    return Response.json({ message: "session not found" }, { status: 404 });

  return Response.json({ data: session });
}

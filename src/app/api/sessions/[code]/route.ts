import { auth } from "@/auth";
import { deleteGroupSession, getGroupSessionByCode } from "@/db/session";
import { getHostId } from "@/db/session/helpers";

type Params = Promise<{ code: string }>;

export async function DELETE(_: Request, { params }: { params: Params }) {
  const { code } = await params;
  const session = (await auth())!;
  const hostId = await getHostId(code);

  if (session.user.id !== hostId)
    return Response.json(
      { error: { message: "unauthorised" } },
      { status: 403 }
    );

  await deleteGroupSession(hostId, code);
  return Response.json({ message: "success" });
}

export async function GET(_: Request, { params }: { params: Params }) {
  const { code } = await params;
  const session = await getGroupSessionByCode(code);

  if (!session)
    return Response.json(
      { error: { message: "resource not found" } },
      { status: 404 }
    );

  return Response.json({ data: session });
}

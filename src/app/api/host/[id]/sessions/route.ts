import { auth } from "@/auth";
import { getGroupSessionsOfHost } from "@/db/group-session";

type Params = Promise<{ id: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  const { id: hostId } = await params;
  const session = (await auth())!;

  if (session.user.id !== hostId)
    return Response.json(
      { error: { message: "unauthorised" } },
      { status: 403 },
    );

  return Response.json({ data: await getGroupSessionsOfHost(hostId) });
}

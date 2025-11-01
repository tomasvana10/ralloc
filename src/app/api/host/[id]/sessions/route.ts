import { auth } from "@/auth";
import { getHostSessions } from "@/db/session";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessions = await getHostSessions(id);
  const session = (await auth())!;

  if (session.user.id !== id)
    return Response.json({ message: "unauthorised" }, { status: 403 });

  return Response.json({ data: sessions });
}

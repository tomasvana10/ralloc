import { auth } from "@/auth";
import { getGroupSessionsOfHost } from "@/db/group-session";
import { rateLimit } from "@/db/rate-limit";

type Params = Promise<{ id: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  const { id: hostId } = await params;
  const session = (await auth())!;

  const { rheaders, res } = await rateLimit(
    session.user.id,
    "GET@host/[id]/sessions",
    30,
    5,
  );

  if (res) return res;

  if (session.user.id !== hostId)
    return Response.json(
      { error: { message: "unauthorised" } },
      { status: 403 },
    );

  return rheaders(
    Response.json({ data: await getGroupSessionsOfHost(hostId) }),
  );
}

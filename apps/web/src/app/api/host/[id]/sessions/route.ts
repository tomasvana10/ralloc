import { getGroupSessionsOfHost } from "@core/db/group-session";
import { rateLimit } from "@core/db/rate-limit";
import { auth } from "@web/auth";

type Context = RouteContext<"/api/host/[id]/sessions">;

export async function GET(_: Request, { params }: Context) {
  const { id: hostId } = await params;
  const session = (await auth())!;

  const { withRateLimitHeaders, res } = await rateLimit({
    id: session.user.id,
    categories: ["host/[id]/sessions", "GET"],
    requestsPerMinute: 30,
    burst: 5,
  });

  if (res) return res;

  if (session.user.id !== hostId) return new Response(null, { status: 403 });

  return withRateLimitHeaders(
    Response.json({ data: await getGroupSessionsOfHost(hostId) }),
  );
}

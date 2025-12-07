import { auth } from "@/auth";
import { createGroupSession, getHostedSessionCount } from "@/db/group-session";
import { rateLimit } from "@/db/rate-limit";
import { sessionCreateSchema } from "@/features/forms/session-create";
import { MAX_USER_SESSIONS } from "@/lib/group-session";
import { getZodSafeParseErrorResponse } from "@/lib/utils";

export async function POST(req: Request) {
  const session = (await auth())!;
  const userId = session.user.id;

  const { withRateLimitHeaders, res } = await rateLimit({
    id: session.user.id,
    categories: ["sessions", "POST"],
    requestsPerMinute: 15,
    burst: 3,
  });
  if (res) return res;

  if ((await getHostedSessionCount(userId)) + 1 > MAX_USER_SESSIONS)
    return Response.json(
      {
        error: {
          message: `You have exceeded the maximum amount of active sessions (${MAX_USER_SESSIONS})`,
        },
      },
      { status: 400 },
    );

  const body = await req.json().catch(() => null);
  if (!body) return new Response(null, { status: 400 });
  const parseResult = sessionCreateSchema.safeParse(body);

  if (!parseResult.success)
    return withRateLimitHeaders(getZodSafeParseErrorResponse(parseResult));

  const code = await createGroupSession(parseResult.data, userId, session);
  return withRateLimitHeaders(Response.json({ code }, { status: 201 }));
}

import {
  createGroupSession,
  getHostedSessionCount,
} from "@core/db/group-session";
import { rateLimit } from "@core/db/rate-limit";
import { MAX_USER_SESSIONS } from "@core/lib/group-session";
import { sessionCreateSchema } from "@core/schema/group-session/create";
import { auth } from "@web/auth";
import { getZodSafeParseErrorResponse } from "@web/lib/utils";

export async function POST(req: Request) {
  const session = (await auth())!;
  const userId = session.user.id;

  const { rlHeaders, res } = await rateLimit({
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
    return rlHeaders(getZodSafeParseErrorResponse(parseResult));

  const code = await createGroupSession(parseResult.data, userId, session);
  return rlHeaders(Response.json({ code }, { status: 201 }));
}

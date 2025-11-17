import { auth } from "@/auth";
import { createGroupSession, getHostedSessionCount } from "@/db/group-session";
import { sessionCreateSchema } from "@/forms/session-create";
import { MAX_USER_SESSIONS } from "@/lib/group-session/constants";
import { getZodSafeParseErrorResponse } from "@/lib/utils";

export async function POST(req: Request) {
  const session = (await auth())!;
  const userId = session.user.id;

  if ((await getHostedSessionCount(userId)) + 1 > MAX_USER_SESSIONS)
    return Response.json(
      {
        error: {
          message: `You have exceeded the maximum amount of active sessions (${MAX_USER_SESSIONS})`,
        },
      },
      { status: 400 },
    );

  const body = await req.json();
  const parseResult = sessionCreateSchema.safeParse(body);

  if (!parseResult.success) return getZodSafeParseErrorResponse(parseResult);

  await createGroupSession(parseResult.data, userId);
  return Response.json({ message: "success" }, { status: 201 });
}

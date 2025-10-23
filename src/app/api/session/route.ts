import { auth } from "@/auth";
import { sessionCreateSchema } from "@/components/forms/session-create";
import { setGroupSession } from "@/db/session";
import { getHostedSessionCount } from "@/db/session/helpers";
import { MAX_USER_SESSIONS } from "@/lib/constants";
import { getZodSafeParseErrorResponse } from "@/lib/utils";

export async function POST(req: Request) {
  const body = await req.json();

  const parseResult = sessionCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return getZodSafeParseErrorResponse(parseResult);
  }

  const session = (await auth())!;
  const userId = session.user.id;
  if ((await getHostedSessionCount(userId)) > MAX_USER_SESSIONS) {
    return Response.json(
      {
        message: `you have exceeded the maximum amount of active sessions (${MAX_USER_SESSIONS})`,
      },
      { status: 400 }
    );
  }

  await setGroupSession(parseResult.data, userId);
  return new Response("success");
}

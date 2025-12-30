import { config } from "@core/config";
import { getToken } from "next-auth/jwt";

export async function getSessionFromCookie(cookie: string, secret: string) {
  const token = await getToken({
    req: { headers: { cookie } },
    secret,
    secureCookie: config.isProduction,
  });

  return token ? { id: token.id } : null;
}

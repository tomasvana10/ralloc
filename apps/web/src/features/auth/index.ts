import { randomBytes } from "node:crypto";
import { GUEST_PROVIDER, type OfficialProvider } from "@core/auth/provider";
import { config } from "@core/config";
import { pruneUserData } from "@core/db/prune";
import { UserRepresentation } from "@core/lib/group-session";
import { guestSignInSchema } from "@core/schema/auth/guest-sign-in";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

/**
 * @remarks
 * Declare your `next-auth` providers here.
 */
const providers: Provider[] = [Google, GitHub];

if (config.isGuestAuthEnabled) {
  providers.push(
    Credentials({
      id: GUEST_PROVIDER,
      credentials: {
        nickname: { label: "Nickname", type: "text" },
      },
      authorize: (credentials) => {
        const parseResult = guestSignInSchema.safeParse(credentials);
        if (!parseResult.success) return null;

        const { nickname } = parseResult.data;

        return {
          id: randomBytes(12).toString("base64url"),
          name: nickname,
        };
      },
    }),
  );
}

export const nextAuth = NextAuth({
  providers,
  events: {
    signOut: async (message) => {
      // delete all user data if they didn't use an official authentication
      // method. this prevents users from clogging up the database by repeatedly
      // creating guest sessions
      if ("token" in message && message.token?.provider === GUEST_PROVIDER) {
        await pruneUserData(message.token.id);
      }
    },
  },
  callbacks: {
    authorized: async ({ auth }) => !!auth,
    jwt: async ({ token, account, profile, user }) => {
      if (!account) return token;

      if (!account.provider || !user?.name) return null;

      token.provider = account.provider;
      token.name = user.name;

      if (account.provider === GUEST_PROVIDER) {
        token.id = user.id;
      } else {
        const provider = account.provider as OfficialProvider;
        token.id = String(profile?.sub ?? profile?.id ?? token.id);

        if (user.image) {
          token.imageId = UserRepresentation.getImageId(user.image, provider);
        }
      }

      return token.id ? token : null;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id;
      session.provider = token.provider;
      session.user.name = token.name;
      session.user.imageId = token.imageId ?? null;
      session.user.isGuest = token.provider === GUEST_PROVIDER;

      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  trustHost: true,
});

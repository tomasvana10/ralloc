import { randomBytes } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { deleteAllHostData } from "@/db/group-session";
import { UserRepresentation } from "@/lib/group-session";
import { EPHEMERAL_PROVIDER, type OfficialProvider } from "./provider";

export const nextAuth = NextAuth({
  providers: [
    Google,
    GitHub,
    Credentials({
      id: EPHEMERAL_PROVIDER,
      credentials: {
        nickname: { label: "Nickname", type: "text" },
      },
      authorize: (credentials) => {
        const nickname = credentials?.nickname as string;
        if (!nickname) return null;

        return {
          id: randomBytes(12).toString("base64"),
          name: nickname,
        };
      },
    }),
  ],
  events: {
    signOut: async (message) => {
      // delete all user data if they didn't use an official authentication
      // method. this prevents users from clogging up the database by repeatedly
      // creating ephemeral sessions
      if (
        "token" in message &&
        message.token?.provider === EPHEMERAL_PROVIDER
      ) {
        await deleteAllHostData(message.token.id);
      }
    },
  },
  callbacks: {
    authorized: async ({ auth }) => !!auth,
    jwt: async ({ token, account, profile, user }) => {
      if (account && user) {
        if (!account.provider || !user.name) {
          return null;
        }

        token.provider = account.provider;
        token.name = user.name;

        if (account.provider === EPHEMERAL_PROVIDER) {
          token.id = user.id;
        } else {
          const provider = account.provider as OfficialProvider;
          token.id = String(profile?.sub || profile?.id || token.id);

          if (user.image) {
            token.imageId = UserRepresentation.getImageId(user.image, provider);
          }
        }

        if (!token.id) {
          return null;
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id;
      session.provider = token.provider;
      session.user.name = token.name;
      session.user.imageId = token.imageId ?? null;

      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  trustHost: true,
});

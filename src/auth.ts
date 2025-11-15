import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google, GitHub],
  callbacks: {
    authorized: async ({ auth }) => !!auth,
    jwt: async ({ token, account, profile }) => {
      if (account && profile) {
        token.id = String(profile.sub || profile.id || token.id);
        token.provider = account.provider;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.id) session.user.id = token.id as string;
      if (token.provider) session.provider = token.provider as string;

      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  trustHost: true,
});

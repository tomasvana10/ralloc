import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    authorized: async ({ auth }) => !!auth,
    jwt: async ({ token, account, profile }) => {
      if (account && profile) {
        token.id = profile.sub;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  trustHost: true,
});

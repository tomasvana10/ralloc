import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    provider: string;
  }

  interface User extends DefaultUser {
    id: string;
  }

  interface JWT {
    id?: string;
    provider?: string;
  }
}

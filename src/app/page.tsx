import { auth } from "@/auth";
import { HomeCards } from "@/components/home-cards";

export default async function RootPage() {
  const session = (await auth())!;

  return <HomeCards userId={session.user.id} />;
}

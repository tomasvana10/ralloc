import { auth } from "@/auth";
import MainTabs from "@/components/main-tabs";
import { MySessions } from "@/components/my-sessions";

export default async function RootPage() {
  const session = (await auth())!;

  return (
    <>
      <MainTabs className="mb-2" />
      <MySessions userId={session.user.id} />
    </>
  );
}

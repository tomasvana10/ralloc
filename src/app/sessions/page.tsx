import { auth } from "@/auth";
import { RoutedMainTabs } from "@/components/routed-tabs";
import { MySessions } from "@/components/my-sessions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sessions",
};

export default async function RootPage() {
  const session = (await auth())!;

  return (
    <>
      <RoutedMainTabs className="mb-2" />
      <MySessions userId={session.user.id} />
    </>
  );
}

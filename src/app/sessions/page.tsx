import type { Metadata } from "next";
import { auth } from "@/auth";
import { MySessions } from "@/components/my-sessions";
import { RoutedMainTabs } from "@/components/routed-tabs";

export const metadata: Metadata = {
  title: "Sessions",
};

export default async function SessionsPage() {
  const session = (await auth())!;

  return (
    <div className="flex flex-col gap-2">
      <RoutedMainTabs />
      <MySessions userId={session.user.id} />
    </div>
  );
}

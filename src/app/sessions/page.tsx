import { auth } from "@/auth";
import { RoutedMainTabs } from "@/components/routed-tabs";
import { MySessions } from "@/components/my-sessions";
import type { Metadata } from "next";

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

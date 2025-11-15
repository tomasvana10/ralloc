import type { Metadata } from "next";
import { auth } from "@/auth";
import { BasePage } from "@/components/base-page";
import { MySessions } from "@/components/my-sessions";
import { RoutedMainTabs } from "@/components/routed-tabs";

export const metadata: Metadata = {
  title: "Sessions",
};

export default async function SessionsPage() {
  const session = (await auth())!;

  return (
    <BasePage>
      <div className="flex flex-col gap-2">
        <RoutedMainTabs />
        <MySessions userId={session.user.id} />
      </div>
    </BasePage>
  );
}

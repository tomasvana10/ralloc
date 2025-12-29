import { auth } from "@web/auth";
import { BasePage } from "@web/components/layout/base-page";
import { RoutedMainTabs } from "@web/components/layout/routed-tabs";
import { MySessions } from "@web/features/my-sessions";
import type { Metadata } from "next";

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

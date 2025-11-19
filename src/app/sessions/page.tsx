import type { Metadata } from "next";
import { auth } from "@/auth";
import { BasePage } from "@/components/base-page";
import { RoutedMainTabs } from "@/components/routed-tabs";
import { SessionsViewer } from "@/features/sessions-viewer";

export const metadata: Metadata = {
  title: "Sessions",
};

export default async function SessionsPage() {
  const session = (await auth())!;

  return (
    <BasePage>
      <div className="flex flex-col gap-2">
        <RoutedMainTabs />
        <SessionsViewer userId={session.user.id} />
      </div>
    </BasePage>
  );
}

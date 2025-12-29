import { BasePage } from "@web/components/layout/base-page";
import { HomeCards } from "@web/components/layout/home-cards";
import { RoutedMainTabs } from "@web/components/layout/routed-tabs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home · Ralloc",
};

export default function HomePage() {
  return (
    <BasePage>
      <div className="flex flex-col gap-2">
        <RoutedMainTabs />
        <HomeCards />
      </div>
    </BasePage>
  );
}

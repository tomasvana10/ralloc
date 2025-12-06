import type { Metadata } from "next";
import { BasePage } from "@/components/layout/base-page";
import { HomeCards } from "@/components/layout/home-cards";
import { RoutedMainTabs } from "@/components/layout/routed-tabs";

export const metadata: Metadata = {
  title: "Home",
};

export default function RootPage() {
  return (
    <BasePage>
      <div className="flex flex-col gap-2">
        <RoutedMainTabs />
        <HomeCards />
      </div>
    </BasePage>
  );
}

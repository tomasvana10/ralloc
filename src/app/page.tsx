import { HomeCards } from "@/components/home-cards";
import { RoutedMainTabs } from "@/components/routed-tabs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home · Ralloc",
};

export default function RootPage() {
  return (
    <div className="flex flex-col gap-2 overflow-auto">
      <RoutedMainTabs />
      <HomeCards />
    </div>
  );
}

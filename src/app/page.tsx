import type { Metadata } from "next";
import { HomeCards } from "@/components/home-cards";
import { RoutedMainTabs } from "@/components/routed-tabs";

export const metadata: Metadata = {
  title: "Home · Ralloc",
};

export default function RootPage() {
  return (
    <div className="flex flex-col gap-2">
      <RoutedMainTabs />
      <HomeCards />
    </div>
  );
}

import { HomeCards } from "@/components/home-cards";
import { RoutedMainTabs } from "@/components/routed-tabs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home · Ralloc",
};

export default async function RootPage() {
  return (
    <>
      <RoutedMainTabs className="mb-2" />
      <HomeCards />
    </>
  );
}

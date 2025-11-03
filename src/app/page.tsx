import { HomeCards } from "@/components/home-cards";
import MainTabs from "@/components/main-tabs";

export default async function RootPage() {
  return (
    <>
      <MainTabs className="mb-2" />
      <HomeCards />
    </>
  );
}

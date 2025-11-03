"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { HomeIcon, ListIcon, type LucideIcon } from "lucide-react";

export type RoutedTabData = {
  value: string;
  label: string;
  icon: LucideIcon;
}[];

type Props = React.ComponentProps<typeof TabsPrimitive.Root>;

export function RoutedTabs({
  className,
  tabs,
  ...props
}: Props & { tabs: RoutedTabData }) {
  const pathname = usePathname();

  return (
    <Tabs value={pathname} className={className} {...props}>
      <TabsList>
        {tabs.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} asChild>
            <Link href={tab.value}>
              <tab.icon />
              {tab.label}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function RoutedMainTabs({ className, ...props }: Props) {
  const tabs: RoutedTabData = [
    { value: "/", label: "Home", icon: HomeIcon },
    { value: "/sessions", label: "Sessions", icon: ListIcon },
  ];
  return <RoutedTabs className={className} tabs={tabs} {...props} />;
}

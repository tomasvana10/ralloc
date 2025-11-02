"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { HomeIcon, ListIcon } from "lucide-react";

const tabs = [
  { value: "/", label: "Home", icon: HomeIcon },
  { value: "/sessions", label: "Sessions", icon: ListIcon },
];

export default function MainTabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
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

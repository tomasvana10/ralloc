"use client";

import { LogOutIcon } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { confirm } from "@/features/confirm";

export function SignOutItem({
  signOut,
  isGuest,
}: {
  signOut: () => Promise<void>;
  isGuest: boolean;
}) {
  return (
    <DropdownMenuItem
      variant={isGuest ? "destructive" : "default"}
      onSelect={async () => {
        let shouldSignOut = true;
        if (isGuest) {
          shouldSignOut = await confirm({
            message:
              "Since you signed in as a guest, your data will be permanently lost when you sign out.",
            actionMessage: "Sign Out",
            actionVariant: "destructive",
          });
        }
        if (shouldSignOut) signOut();
      }}>
      Sign Out <LogOutIcon className="ml-2 h-4 w-4" />
    </DropdownMenuItem>
  );
}

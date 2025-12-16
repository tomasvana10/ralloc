"use server";

import { auth, signOut } from "@/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { ClientAvatar } from "./avatar";
import { SignOutItem } from "./sign-out-item";

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/auth/signin" });
}

export async function Profile() {
  const session = await auth();

  if (!session) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="select-none cursor-pointer">
        <Button variant="outline" size="icon-lg">
          <ClientAvatar
            image={session.user?.image as string | undefined}
            name={session.user?.name}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{session.user?.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <SignOutItem signOut={handleSignOut} isGuest={session.user.isGuest} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

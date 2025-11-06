"use server";

import { auth, signOut } from "@/auth";
import { ClientAvatar } from "./avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

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
        <form action={handleSignOut}>
          <button type="submit" className="w-full">
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

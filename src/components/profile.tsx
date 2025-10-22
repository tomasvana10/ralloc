"use server";

import { auth, signOut } from "@/auth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/signin" });
}

export async function Profile() {
  const session = await auth();

  if (!session) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="select-none cursor-pointer">
        <Button variant="outline" size="icon-lg">
          <Avatar>
            <AvatarImage
              src={session.user?.image as string | undefined}
              alt={`${session.user?.name}'s avatar`}
            />
            <AvatarFallback>
              {session.user?.name
                ?.split(" ")
                .map(p => p[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
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

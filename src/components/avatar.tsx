"use client";

import type * as AvatarPrimitive from "@radix-ui/react-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function ClientAvatar({
  image,
  name,
  imageProps,
}: {
  image?: string;
  name?: string | null;
  imageProps?: React.ComponentProps<typeof AvatarPrimitive.Image>;
}) {
  const initials =
    name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase() ?? "?";

  return (
    <Avatar>
      <AvatarImage
        src={image}
        referrerPolicy="no-referrer"
        alt={`${name}'s avatar`}
        {...imageProps}
      />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

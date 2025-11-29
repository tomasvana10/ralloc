"use client";

import type * as AvatarPrimitive from "@radix-ui/react-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ClientAvatar({
  image,
  name,
  imageProps,
  className,
  ...props
}: {
  image?: string;
  name?: string | null;
  imageProps?: React.ComponentProps<typeof AvatarPrimitive.Image>;
} & React.ComponentProps<typeof AvatarPrimitive.Root>) {
  const initials =
    name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase() ?? "?";

  return (
    <Avatar className={className} {...props}>
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

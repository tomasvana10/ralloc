"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function ClientAvatar({
  image,
  name,
}: {
  image?: string;
  name?: string | null;
}) {
  return (
    <Avatar>
      <AvatarImage src={image} alt={`${name}'s avatar`} />
      <AvatarFallback>
        {name
          ?.split(" ")
          .map(p => p[0])
          .join("")
          .toUpperCase() ?? "?"}
      </AvatarFallback>
    </Avatar>
  );
}

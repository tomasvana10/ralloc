import { ChevronRightIcon } from "lucide-react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "./ui/item";
import Link from "next/link";

interface Props {
  href: string;
  title: string;
  description: string;
}

export function WarningItemWithRedirectOption({
  href,
  title,
  description,
}: Props) {
  return (
    <Item asChild variant="outline">
      <Link href={href}>
        <ItemContent>
          <ItemTitle className="text-destructive">{title}</ItemTitle>
          <ItemDescription>{description}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <ChevronRightIcon className="size-4" />
        </ItemActions>
      </Link>
    </Item>
  );
}

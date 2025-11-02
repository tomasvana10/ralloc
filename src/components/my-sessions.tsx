import { ChevronRightIcon, Trash2 } from "lucide-react";
import { useGroupSessionsSWR } from "@/lib/hooks/swr/groupSessions";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "./ui/item";
import Link from "next/link";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

type Props = ReturnType<typeof useGroupSessionsSWR>;

export function MySessions({ data, mutate }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Group Sessions</CardTitle>
        <CardDescription>
          Manage or go to your active group sessions.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex w-full flex-col gap-4">
          {data.map(session => (
            <Item asChild variant="outline" key={session.code}>
              <Link href="#">
                <ItemActions>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    onClick={async () => {
                      await fetch(`/api/sessions/${session.code}`, {
                        method: "DELETE",
                      });
                      mutate();
                    }}>
                    <Trash2 />
                  </Button>
                </ItemActions>
                <ItemContent>
                  <ItemTitle>{session.name}</ItemTitle>
                  <ItemDescription>{session.description}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <ChevronRightIcon className="size-4" />
                </ItemActions>
              </Link>
            </Item>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

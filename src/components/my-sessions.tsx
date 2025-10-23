import { BoxesIcon } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";

export function MySessions() {
  return <></>;
}

export function MySessionsEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BoxesIcon />
        </EmptyMedia>
        <EmptyTitle>No Group Sessions Yet</EmptyTitle>
        <EmptyDescription>
          You haven't created a group session yet. Create one using the form on
          this page and it will be displayed here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

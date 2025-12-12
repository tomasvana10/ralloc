"use client";

import { FlameIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { confirm } from "@/features/confirm";
import { SessionGroupAddForm } from "@/features/forms/group-session/group-add";
import type { UseGroupSessionReturn } from "../use-group-session";

export function GlobalActionsModal({
  addGroup,
  clearAllGroupMembers,
}: {
  addGroup: UseGroupSessionReturn["addGroup"];
  clearAllGroupMembers: UseGroupSessionReturn["clearAllGroupMembers"];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon-lg"
          aria-label="open global session actions">
          <UsersIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle>Group Session Actions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <SessionGroupAddForm addGroup={addGroup} />
          <Button
            variant="destructive"
            onClick={async () => {
              const result = await confirm({
                message:
                  "All group members will be deallocated. This action can't be undone.",
                actionMessage: "Clear",
                actionVariant: "destructive",
              });
              if (!result) return;

              clearAllGroupMembers();
            }}>
            <FlameIcon />
            Deallocate All Members
          </Button>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="sm:min-w-[80px]">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

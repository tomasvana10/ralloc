"use client";

import { WrenchIcon } from "lucide-react";
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
import { SessionGroupAddForm } from "@/features/forms/session-group-add";
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
        <Button variant="outline" size="icon-lg">
          <WrenchIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle>Global Actions</DialogTitle>
        </DialogHeader>
        <SessionGroupAddForm addGroup={addGroup} />
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

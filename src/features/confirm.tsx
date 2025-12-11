import type { VariantProps } from "class-variance-authority";
import {
  type ConfirmDialogProps,
  confirmable,
  createConfirmation,
} from "react-confirm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, type buttonVariants } from "@/components/ui/button";

const ConfirmationDialog = ({
  show,
  proceed,
  title,
  message,
  cancelMessage,
  cancelVariant,
  actionMessage,
  actionVariant,
}: ConfirmDialogProps<
  {
    title?: string;
    message: string;
    cancelMessage?: string;
    cancelVariant?: VariantProps<typeof buttonVariants>["variant"];
    actionMessage?: string;
    actionVariant?: VariantProps<typeof buttonVariants>["variant"];
  },
  boolean
>) => (
  <AlertDialog open={show}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title ?? "Are you sure?"}</AlertDialogTitle>
        <AlertDialogDescription>{message}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel asChild>
          <Button
            className="min-w-[80px]"
            variant={cancelVariant}
            onClick={() => proceed(false)}>
            {cancelMessage ?? "Cancel"}
          </Button>
        </AlertDialogCancel>
        <AlertDialogAction asChild>
          <Button
            className="min-w-[80px]"
            variant={actionVariant}
            onClick={() => proceed(true)}>
            {actionMessage ?? "Continue"}
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export const confirm = createConfirmation(confirmable(ConfirmationDialog));

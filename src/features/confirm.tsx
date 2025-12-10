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

const ConfirmationDialog = ({
  show,
  proceed,
  title,
  message,
  cancelMessage,
  actionMessage,
}: ConfirmDialogProps<
  {
    title?: string;
    message: string;
    cancelMessage?: string;
    actionMessage?: string;
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
        <AlertDialogCancel
          className="min-w-[80px]"
          onClick={() => proceed(false)}>
          {cancelMessage ?? "Cancel"}
        </AlertDialogCancel>
        <AlertDialogAction
          className="min-w-[80px]"
          onClick={() => proceed(true)}>
          {actionMessage ?? "Continue"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export const confirm = createConfirmation(confirmable(ConfirmationDialog));

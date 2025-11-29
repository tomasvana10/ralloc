import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { BasePage } from "./base-page";

export function BaseNotFound({
  title,
  returnTo,
}: {
  title?: string;
  returnTo?: string;
}) {
  return (
    <BasePage returnTo={returnTo}>
      <Alert variant="default">
        <AlertCircleIcon />
        <AlertTitle>{title ?? "This page couldn't be found"}</AlertTitle>
      </Alert>
    </BasePage>
  );
}

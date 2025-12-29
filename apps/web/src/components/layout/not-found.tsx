import { Alert, AlertTitle } from "@web/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
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

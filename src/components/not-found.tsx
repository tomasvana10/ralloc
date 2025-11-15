import { AlertCircleIcon } from "lucide-react";
import { BasePage } from "./base-page";
import { Alert, AlertTitle } from "./ui/alert";

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

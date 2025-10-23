import { WarningItemWithRedirectOption } from "@/components/warning-item";

export default function NotFound() {
  return (
    <WarningItemWithRedirectOption
      href="/"
      title="This page could not be found"
      description="Click here to return home."
    />
  );
}

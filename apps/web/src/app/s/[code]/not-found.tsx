import { BaseNotFound } from "@web/components/layout/not-found";

export default function NotFound() {
  return (
    <BaseNotFound
      returnTo="/"
      title="This group session doesn't exist. Please double check you entered the code correctly."
    />
  );
}

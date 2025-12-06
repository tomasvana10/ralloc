import { BaseNotFound } from "@/components/layout/not-found";

export default function NotFound() {
  return (
    <BaseNotFound
      returnTo="/home"
      title="This group session doesn't exist. Please double check you entered the code correctly."
    />
  );
}

import { auth } from "@/auth";
import { SignOutCard } from "@/components/sign-out";
import WarningItemWithRedirectOption from "@/components/warning-item";

export default async function Page() {
  const session = await auth();
  if (!session)
    return (
      <WarningItemWithRedirectOption
        href="/signin"
        title="You are already signed out"
        description="Click here to sign in."
      />
    );

  return <SignOutCard />;
}

import { auth } from "@/auth";
import { SignInCard } from "@/components/sign-in";
import { WarningItemWithRedirectOption } from "@/components/warning-item";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  if (session)
    return (
      <WarningItemWithRedirectOption
        href="/"
        title="You are already signed in"
        description="Click here to return home."
      />
    );

  return <SignInCard callbackUrl={(await searchParams)?.callbackUrl} />;
}

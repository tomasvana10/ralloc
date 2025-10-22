import SignIn from "@/components/sign-in";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  return <SignIn callbackUrl={(await searchParams)?.callbackUrl} />;
}

import { auth } from "@/auth";
import { SignInCard } from "@/components/sign-in";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  if (session) return redirect("/");

  return <SignInCard callbackUrl={(await searchParams)?.callbackUrl} />;
}

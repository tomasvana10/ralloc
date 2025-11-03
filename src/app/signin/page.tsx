import { auth } from "@/auth";
import { SignInCard } from "@/components/sign-in";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  if (session) return redirect("/");

  return <SignInCard callbackUrl={(await searchParams)?.callbackUrl} />;
}

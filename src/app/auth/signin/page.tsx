import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInCard } from "@/components/auth/sign-in";
import { BasePage } from "@/components/layout/base-page";

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

  return (
    <BasePage>
      <SignInCard callbackUrl={(await searchParams)?.callbackUrl} />
    </BasePage>
  );
}

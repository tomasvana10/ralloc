import { auth } from "@web/auth";
import { SignInCard } from "@web/components/auth/sign-in";
import { BasePage } from "@web/components/layout/base-page";
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

  return (
    <BasePage>
      <SignInCard callbackUrl={(await searchParams)?.callbackUrl} />
    </BasePage>
  );
}

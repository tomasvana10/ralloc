import { ChevronLeftIcon, HomeIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { Profile } from "../auth/profile";
import { ThemeCycler } from "../theme-cycler";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Toaster } from "../ui/sonner";
import { Footer } from "./footer";

const returnToIcons: Record<string, LucideIcon> = {
  "/home": HomeIcon,
};

export async function BasePage({
  children,
  returnTo,
}: Readonly<{
  children: React.ReactNode;
  returnTo?: string;
}>) {
  const session = await auth();
  const ReturnToIcon = !returnTo ? null : (returnToIcons[returnTo] ?? null);

  return (
    <div className="flex justify-center sm:p-10 p-1 min-h-screen">
      <Card className="max-w-[700px] w-full gap-4">
        <CardHeader className="flex justify-between max-[450px]:gap-4">
          <div>
            <CardTitle className="text-3xl">
              <div className="flex items-center gap-4">
                {returnTo && (
                  <Link href={returnTo} tabIndex={-1} className="leading-0">
                    <Button variant="outline" aria-label="Go back">
                      <ChevronLeftIcon className="size-4" />
                      {ReturnToIcon && <ReturnToIcon className="size-4" />}
                    </Button>
                  </Link>
                )}
                <span>Ralloc</span>
              </div>
            </CardTitle>
          </div>
          <div className="flex gap-2 max-[350px]:flex-col-reverse">
            <ThemeCycler />
            {session ? <Profile /> : null}
          </div>
        </CardHeader>
        <CardContent className="max-sm:p-1">
          {children}
          <Toaster position="top-right" richColors />
        </CardContent>
        <CardFooter className="justify-center items-end h-full">
          <Footer />
        </CardFooter>
      </Card>
    </div>
  );
}

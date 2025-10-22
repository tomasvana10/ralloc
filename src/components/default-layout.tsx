import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Profile } from "./profile";
import { ThemeCycler } from "./theme-cycler";

export async function DefaultLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <div className="flex justify-center sm:p-10 p-1">
      <Card className="max-w-[850px] w-full">
        <CardHeader className="flex justify-between">
          <div>
            <CardTitle className="text-3xl">Ralloc</CardTitle>
            <CardDescription className="mt-2">
              The go-to tool for simple, ephemeral group allocation sessions.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <ThemeCycler />
            {!!session ? <Profile /> : null}
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
    <div className="flex justify-center sm:p-10 p-1 min-h-screen">
      <Card className="max-w-[700px] w-full">
        <CardHeader className="flex justify-between max-[350px]:flex-col-reverse max-[450px]:gap-4">
          <div>
            <CardTitle className="text-3xl">Ralloc</CardTitle>
            <CardDescription className="mt-2">
              The go-to tool for simple, ephemeral group allocation sessions.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <ThemeCycler />
            {session ? <Profile /> : null}
          </div>
        </CardHeader>
        <CardContent className="max-sm:p-1">{children}</CardContent>
      </Card>
    </div>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

export function ContextWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex justify-center sm:p-10 p-1">
      <Card className="max-w-[850px] w-full">
        <CardHeader>
          <CardTitle className="text-3xl">Ralloc</CardTitle>
          <CardDescription>
            The go-to tool for simple, ephemeral group allocation sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

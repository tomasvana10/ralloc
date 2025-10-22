import { signIn } from "@/auth";
import { Button } from "./ui/button";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface Props {
  callbackUrl?: string;
}

export function SignInCard({ callbackUrl }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in to Ralloc</CardTitle>
        <CardDescription>
          Please use one of the authentication methods listed below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm callbackUrl={callbackUrl} />
      </CardContent>
    </Card>
  );
}

export function SignInForm({ callbackUrl }: Props) {
  return (
    <form
      id="form-signin-google"
      action={async () => {
        "use server";
        await signIn("google", {
          redirectTo: callbackUrl ?? "/",
        });
      }}>
      <Button
        type="submit"
        variant="outline"
        className="flex whitespace-normal h-auto min-h-[2.5rem]">
        <Image
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="google logo"
          width="20"
          height="20"
        />
        <span className="text-left">Sign in with Google</span>
      </Button>
    </form>
  );
}

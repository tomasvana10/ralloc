import { signIn } from "@/auth";
import { Button } from "./ui/button";
import Image from "next/image";
import { Field, FieldGroup, FieldLabel } from "./ui/field";

interface Props {
  callbackUrl?: string;
}

export default function SignIn({ callbackUrl }: Props) {
  return (
    <form
      id="form-signin-google"
      action={async () => {
        "use server";
        await signIn("google", {
          redirectTo: callbackUrl ?? "/",
        });
      }}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="form-signin-google">
            You must sign in to access this page
          </FieldLabel>
          <Button type="submit" variant="outline">
            <Image
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="google logo"
              width="20"
              height="20"
            />
            Sign in with Google
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

import { signIn } from "@/auth";

type Props = {
  callbackUrl: string;
};

export default function SignIn({ callbackUrl }: Props) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", {
          redirectTo: callbackUrl,
        });
      }}>
      <button type="submit">Signin with Google</button>
    </form>
  );
}

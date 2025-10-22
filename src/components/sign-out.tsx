import { signOut } from "@/auth";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function SignOutCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Are you sure you want to sign out?</CardTitle>
      </CardHeader>
      <CardContent>
        <SignOutForm />
      </CardContent>
    </Card>
  );
}

export function SignOutForm() {
  return (
    <form
      id="form-signin-google"
      action={async _ => {
        "use server";
        await signOut({ redirectTo: "/signin" });
      }}>
      <Button type="submit" variant="outline">
        Sign out
      </Button>
    </form>
  );
}

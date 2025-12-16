import { signIn } from "@/auth";
import { IS_GUEST_SIGNIN_ENABLED } from "@/authentication";
import { GuestSignInForm } from "@/authentication/guest-sign-in-form";
import { ProviderIcon } from "@/authentication/icon";
import {
  OFFICIAL_PROVIDERS,
  type OfficialProvider,
} from "@/authentication/provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SignInCard({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Use one of the authentication providers listed below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 [&>form]:flex-1 [&>form>button]:w-full [&>form>button]:whitespace-nowrap">
          {Object.keys(OFFICIAL_PROVIDERS).map((provider) => (
            <OfficialSignInForm
              key={provider}
              callbackUrl={callbackUrl}
              provider={provider as OfficialProvider}
            />
          ))}
        </div>
        {IS_GUEST_SIGNIN_ENABLED && (
          <>
            <div className="text-sm text-muted-foreground my-6 gap-2">
              <p>
                Or, sign in as a guest.{" "}
                <strong>
                  Your data will be permanently lost when you sign out.
                </strong>
              </p>
            </div>
            <GuestSignInForm callbackUrl={callbackUrl} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function OfficialSignInForm({
  callbackUrl,
  provider,
}: {
  callbackUrl?: string;
  provider: OfficialProvider;
}) {
  return (
    <form
      id={`form-signin-${provider}`}
      action={async () => {
        "use server";
        await signIn(provider, {
          redirectTo: callbackUrl ?? "/",
        });
      }}>
      <Button
        type="submit"
        variant="outline"
        className="flex whitespace-normal h-auto min-h-[2.5rem]">
        {<ProviderIcon provider={provider} />}
        <span className="text-left">
          Sign in with {provider[0].toUpperCase() + provider.slice(1)}
        </span>
      </Button>
    </form>
  );
}

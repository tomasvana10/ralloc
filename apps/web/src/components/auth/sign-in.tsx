import { OFFICIAL_PROVIDERS, type OfficialProvider } from "@core/auth/provider";
import { config } from "@core/config";
import { signIn } from "@web/auth";
import { Button } from "@web/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@web/components/ui/card";
import { ProviderIcon } from "@web/features/auth/icon";
import { GuestSignInForm } from "@web/features/forms/auth/guest-sign-in";

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
        {config.isGuestAuthEnabled && (
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

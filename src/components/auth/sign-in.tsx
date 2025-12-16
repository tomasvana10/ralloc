import { signIn } from "@/auth";
import {
  PROVIDER_ICON_DATA,
  ProviderIcon,
  type ProviderIconData,
} from "@/authentication/icon";
import {
  GUEST_PROVIDER,
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
import { GuestSignInForm } from "@/features/forms/guest-sign-in";

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
          {Object.entries(PROVIDER_ICON_DATA).map(
            ([provider, data]) =>
              provider !== GUEST_PROVIDER && (
                <OfficialSignInForm
                  key={provider}
                  callbackUrl={callbackUrl}
                  provider={provider as OfficialProvider}
                  data={data}
                />
              ),
          )}
        </div>
        <div className="text-sm text-muted-foreground my-6 gap-2">
          <p>
            Or, sign in to a one-time session.{" "}
            <strong>
              Your data will be permanently lost when you sign out.
            </strong>
          </p>
        </div>
        <GuestSignInForm callbackUrl={callbackUrl} />
      </CardContent>
    </Card>
  );
}

export function OfficialSignInForm({
  callbackUrl,
  provider,
  data,
}: {
  callbackUrl?: string;
  provider: OfficialProvider;
  data: ProviderIconData;
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
        {<ProviderIcon data={data} />}
        <span className="text-left">
          Sign in with {provider[0].toUpperCase() + provider.slice(1)}
        </span>
      </Button>
    </form>
  );
}

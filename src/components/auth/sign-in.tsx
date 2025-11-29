import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PROVIDER_DATA } from "@/lib/constants";
import type { SupportedProvider } from "@/lib/types";
import { ProviderIcon } from "./provider-svgs";

export function SignInCard({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Please use one of the authentication methods listed below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 [&>form]:flex-1 [&>form>button]:w-full [&>form>button]:whitespace-nowrap">
          {Object.entries(PROVIDER_DATA).map(([provider, data]) => (
            <SignInForm
              key={provider}
              callbackUrl={callbackUrl}
              provider={provider as SupportedProvider}
              data={data}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SignInForm({
  callbackUrl,
  provider,
  data,
}: {
  callbackUrl?: string;
  provider: SupportedProvider;
  data: (typeof PROVIDER_DATA)[keyof typeof PROVIDER_DATA];
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

import Image from "next/image";
import { signIn } from "@/auth";
import { PROVIDER_SVGS } from "@/lib/constants";
import type { SupportedProvider } from "@/lib/types";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

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
          {(Object.keys(PROVIDER_SVGS) as SupportedProvider[]).map(
            (provider) => (
              <SignInForm
                key={provider}
                callbackUrl={callbackUrl}
                provider={provider}
              />
            ),
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SignInForm({
  callbackUrl,
  provider,
}: {
  callbackUrl?: string;
  provider: SupportedProvider;
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
        <Image
          src={PROVIDER_SVGS[provider]}
          alt={`${provider} logo`}
          width="20"
          height="20"
        />
        <span className="text-left">
          Sign in with {provider[0].toUpperCase() + provider.slice(1)}
        </span>
      </Button>
    </form>
  );
}

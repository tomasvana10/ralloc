"use client";
import { createContext, useContext } from "react";

interface Context {
  baseUrl: string | undefined;
  baseWsUrl: string | undefined;
}

const EnvContext = createContext<Context>({
  baseUrl: undefined,
  baseWsUrl: undefined,
});

// https://stackoverflow.com/questions/79484303/how-to-set-next-public-environment-variables-after-next-js-build-in-docker
// according to this page (and an hour of conversation with AI), you can't bake NEXT_PUBLIC_* variables into the client-side
// bundle with docker, so, this provider is used.

export function PublicEnvProvider({
  children,
  baseUrl,
  baseWsUrl,
}: {
  children: React.ReactNode;
} & Context) {
  return (
    <EnvContext.Provider value={{ baseUrl, baseWsUrl }}>
      {children}
    </EnvContext.Provider>
  );
}

export const usePublicEnv = () => useContext(EnvContext);

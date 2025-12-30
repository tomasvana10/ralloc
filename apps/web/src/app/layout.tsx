import { ThemeProvider } from "@web/components/providers/theme-provider";
import "./globals.css";
import { PublicEnvProvider } from "@web/components/providers/public-env-provider";
import { ScrollArea, ScrollBar } from "@web/components/ui/scroll-area";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Ralloc",
    template: "%s · Ralloc",
  },
  description:
    "The go-to tool for simple, ephemeral group allocation sessions.",
  keywords: ["group", "groups", "management", "group management"],
  icons: {
    icon: [
      {
        url: "/icon-light.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          <PublicEnvProvider
            baseUrl={process.env.URL}
            baseWsUrl={process.env.WS_URL}>
            <ScrollArea type="scroll" className="h-screen w-full">
              {children}
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </PublicEnvProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

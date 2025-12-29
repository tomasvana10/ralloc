import { ThemeProvider } from "@web/components/providers/theme-provider";
import "./globals.css";
import { ScrollArea, ScrollBar } from "@web/components/ui/scroll-area";
import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";

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

const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  variable: "--font-atkinson",
  fallback: ["sans-serif"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={atkinson.variable}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          <ScrollArea type="scroll" className="h-screen w-full">
            {children}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </ThemeProvider>
      </body>
    </html>
  );
}

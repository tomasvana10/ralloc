import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";
import type { Metadata } from "next";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
          <ScrollArea type="scroll" className="h-screen w-full">
            {children}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </ThemeProvider>
      </body>
    </html>
  );
}

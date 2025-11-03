import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";
import { DefaultLayout } from "@/components/default-layout";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Ralloc",
    template: "%s · Ralloc",
  },
  description:
    "The go-to tool for simple, ephemeral group allocation sessions.",
  keywords: ["group", "groups", "management", "group management"],
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
          <DefaultLayout>
            <main>{children}</main>
            <Toaster position="top-right" richColors />
          </DefaultLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}

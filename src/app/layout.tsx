import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";
import { DefaultLayout } from "@/components/default-layout";
import { Toaster } from "@/components/ui/sonner";

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
          disableTransitionOnChange
        >
          <DefaultLayout>
            <main>{children}</main>
            <Toaster />
          </DefaultLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}

import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";
import { ContextWrapper } from "@/components/context-wrapper";
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
          disableTransitionOnChange>
          <ContextWrapper>
            <main>{children}</main>
            <Toaster />
          </ContextWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}

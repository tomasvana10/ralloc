import { Atkinson_Hyperlegible_Next } from "next/font/google";

const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  variable: "--font-atkinson",
  fallback: ["sans-serif"],
});

export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={atkinson.variable}>{children}</div>;
}

import type { Metadata } from "next";
import { BaseNotFound } from "@/components/not-found";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return <BaseNotFound returnTo="/" />;
}

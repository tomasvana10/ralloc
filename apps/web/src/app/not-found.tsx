import { BaseNotFound } from "@web/components/layout/not-found";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return <BaseNotFound returnTo="/" />;
}

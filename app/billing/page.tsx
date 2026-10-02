import type { Metadata } from "next";
import BillingOverview from "@/components/billing/BillingOverview";

export const metadata: Metadata = {
  title: "Abo | UniVerse",
  description: "Status deines Premium-Abos, Zahlung und Kündigung.",
};

export default function BillingPage() {
  return <BillingOverview />;
}

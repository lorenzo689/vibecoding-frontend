import type { Metadata } from "next";
import BillingResult from "@/components/billing/BillingResult";

export const metadata: Metadata = {
  title: "Kauf abgebrochen | UniVerse",
  description: "Der Bezahlvorgang wurde abgebrochen.",
};

export default function BillingCancelPage() {
  return <BillingResult outcome="cancel" />;
}

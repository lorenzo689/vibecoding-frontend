import type { Metadata } from "next";
import BillingResult from "@/components/billing/BillingResult";

export const metadata: Metadata = {
  title: "Kauf abgeschlossen | UniVerse",
  description: "Rückmeldung nach dem Bezahlvorgang.",
};

export default function BillingSuccessPage() {
  return <BillingResult outcome="success" />;
}

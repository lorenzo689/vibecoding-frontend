import Link from "next/link";
import { describeProCard, type OwnSubscription } from "@/lib/billing";
import s from "./profile.module.css";

// Dezenter Hinweis auf UniVerse Pro. Status und Texte kommen aus den Billing-Helfern, hier gibt es
// keine eigene Stripe- oder Statuslogik. Alles Weitere (Abschluss, Verwaltung) passiert auf /billing.
export default function ProfileProCard({
  subscription,
  unavailable,
}: {
  subscription: OwnSubscription | null;
  unavailable: boolean;
}) {
  const view = describeProCard(subscription, unavailable);
  return (
    <aside className={s.card} aria-labelledby="pro-card-heading">
      <h2 id="pro-card-heading">UniVerse Pro</h2>
      <p className={s.proStatus} data-pro={view.pro}>{view.status}</p>
      <p className={s.supportingText}>{view.text}</p>
      <Link href="/billing" className={s.proLink}>{view.linkLabel}</Link>
    </aside>
  );
}

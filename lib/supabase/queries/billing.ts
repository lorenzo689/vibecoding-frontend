import { FunctionsHttpError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import type { Tables } from "@/lib/supabase/database.types";

// Contract read from ../backend/supabase/functions/create-checkout-session and
// create-portal-session (backend dev 59301ea; no docs/ page exists for these yet).
// The row is read-only for clients: only the Stripe webhook writes it, with
// elevated server credentials, so a user can never mark themselves as paying.

export type Subscription = Pick<
  Tables<"subscriptions">,
  "status" | "price_id" | "current_period_end" | "cancel_at_period_end"
>;

// Stripe statuses that grant access. "past_due" still counts: payment retries
// are in flight and cutting access off immediately would punish a card hiccup.
const ACTIVE_STATUS = new Set(["active", "trialing", "past_due"]);

export function isActive(subscription: Subscription | null): boolean {
  return subscription !== null && ACTIVE_STATUS.has(subscription.status);
}

export async function getSubscription(): Promise<Subscription | null> {
  const { data, error } = await createClient()
    .from("subscriptions")
    .select("status, price_id, current_period_end, cancel_at_period_end")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export class BillingError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.name = "BillingError";
    this.code = code;
  }
}

async function sessionUrl(functionName: string): Promise<string> {
  const { data, error } = await createClient().functions.invoke<{ url: string }>(functionName, {
    body: {},
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const failure = (await error.context.json()) as { error?: { code?: string } };
        throw new BillingError(failure.error?.code ?? "SERVICE_UNAVAILABLE");
      } catch (parsed) {
        if (parsed instanceof BillingError) throw parsed;
      }
    }
    throw new BillingError("SERVICE_UNAVAILABLE");
  }

  const url = data?.url;
  if (!url) throw new BillingError("SERVICE_UNAVAILABLE");
  return url;
}

/** Stripe-hosted checkout. The price is chosen server-side, never by the client. */
export function startCheckout(): Promise<string> {
  return sessionUrl("create-checkout-session");
}

/** Stripe-hosted customer portal for changing payment details or cancelling. */
export function openBillingPortal(): Promise<string> {
  return sessionUrl("create-portal-session");
}

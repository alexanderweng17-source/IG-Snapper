import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | undefined;
export function getStripeServerClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  if (!stripeClient) stripeClient = new Stripe(key);
  return stripeClient;
}

// create-checkout-session.mjs
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_AMOUNT = 24999; // 249.99 EUR
const CURRENCY = "eur";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed", code: "METHOD_NOT_ALLOWED" } });
  }

  try {
    const { instantDbUserId, email } = req.body;
    if (!instantDbUserId || !email) {
      return res.status(400).json({ error: { message: "instantDbUserId et email sont requis", code: "MISSING_PARAMS" } });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:8000";
    const successUrl = new URL("/payment-success?session_id={CHECKOUT_SESSION_ID}", baseUrl).toString();
    const cancelUrl = new URL("/payment-canceled", baseUrl).toString();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: CURRENCY,
          product_data: {
            name: "THE WHITE LIST - Abonnement Premium",
            description: "Acces illimite a l'outil de conciergerie de luxe - 14 jours d'essai offerts",
          },
          unit_amount: PRICE_AMOUNT,
          recurring: { interval: "month" },
        },
        quantity: 1,
      }],
      metadata: { instant_db_user_id: instantDbUserId, email },
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: { trial_period_days: 14 },
    });

    return res.status(200).json({ data: { sessionId: session.id, url: session.url } });
  } catch (error) {
    console.error("[Stripe] Error:", error);
    return res.status(500).json({ error: { message: "Erreur interne", code: "INTERNAL_ERROR" } });
  }
}

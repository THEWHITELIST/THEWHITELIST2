import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Price for THE WHITE LIST subscription (249.99EUR/month)
const PRICE_AMOUNT = 24999; // In cents
const CURRENCY = "eur";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed", code: "METHOD_NOT_ALLOWED" } });
  }

  try {
    const { instantDbUserId, email } = req.body;

    console.log("[Stripe] Creating checkout session for:", { instantDbUserId, email });

    if (!instantDbUserId || !email) {
      return res.status(400).json({
        error: { message: "instantDbUserId et email sont requis", code: "MISSING_PARAMS" },
      });
    }

    // Determine URLs based on environment
    // Use VERCEL_URL for Vercel deployments, or custom domain
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    "http://localhost:8000";
    const successUrl = `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/payment-canceled`;

    console.log("[Stripe] URLs:", { successUrl, cancelUrl });

    // Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            product_data: {
              name: "THE WHITE LIST - Abonnement Premium",
              description: "Acces illimite a l'outil de conciergerie de luxe - 14 jours d'essai offerts",
            },
            unit_amount: PRICE_AMOUNT,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        instant_db_user_id: instantDbUserId,
        email: email,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 14,
      },
    });

    console.log("[Stripe] Session created:", session.id);

    return res.status(200).json({
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error("[Stripe] Error creating checkout session:", error);
    return res.status(500).json({
      error: {
        message: error instanceof Error ? error.message : "Erreur lors de la creation de la session",
        code: "STRIPE_ERROR",
      },
    });
  }
}

import { Hono } from "hono";
import Stripe from "stripe";
import { env } from "../env";

// Initialize Stripe with the secret key
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// Price for THE WHITE LIST subscription (249.99€/month)
const PRICE_AMOUNT = 24999; // In cents
const CURRENCY = "eur";

const stripeRouter = new Hono();

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe Checkout Session for subscription payment
 */
stripeRouter.post("/create-checkout-session", async (c) => {
  try {
    const body = await c.req.json();
    const { instantDbUserId, email } = body;

    console.log("[Stripe] Creating checkout session for:", { instantDbUserId, email });

    if (!instantDbUserId || !email) {
      return c.json(
        { error: { message: "instantDbUserId et email sont requis", code: "MISSING_PARAMS" } },
        400
      );
    }

    // Determine URLs based on environment
    // Prefer FRONTEND_URL, then BASE_URL, then fallback to localhost
    const frontendUrl = env.FRONTEND_URL || process.env.BASE_URL || process.env.VITE_BASE_URL || "http://localhost:8000";
    const successUrl = `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/payment-canceled`;

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
              description: "Accès illimité à l'outil de conciergerie de luxe - 14 jours d'essai offerts",
            },
            unit_amount: PRICE_AMOUNT,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      // CRITIQUE: Ajouter les metadata avec l'ID InstantDB
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

    return c.json({
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error("[Stripe] Error creating checkout session:", error);
    return c.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Erreur lors de la création de la session",
          code: "STRIPE_ERROR",
        },
      },
      500
    );
  }
});

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events (checkout.session.completed, etc.)
 */
stripeRouter.post("/webhook", async (c) => {
  const signature = c.req.header("stripe-signature");

  if (!signature) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return c.json({ error: { message: "Missing stripe-signature header", code: "MISSING_SIGNATURE" } }, 400);
  }

  // Get raw body for signature verification
  const rawBody = await c.req.text();

  let event: Stripe.Event;

  try {
    // Verify webhook signature if secret is configured
    if (env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } else {
      // In development, parse without verification (NOT RECOMMENDED FOR PRODUCTION)
      console.warn("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured, parsing without verification");
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return c.json({ error: { message: "Invalid signature", code: "INVALID_SIGNATURE" } }, 400);
  }

  console.log("[Stripe Webhook] Received event:", event.type);

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("[Stripe Webhook] Checkout session completed:", session.id);
      console.log("[Stripe Webhook] Metadata:", session.metadata);

      const instantDbUserId = session.metadata?.instant_db_user_id;
      const email = session.metadata?.email;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (!instantDbUserId) {
        console.error("[Stripe Webhook] No instant_db_user_id in metadata");
        return c.json({ error: { message: "No user ID in metadata", code: "NO_USER_ID" } }, 400);
      }

      console.log("[Stripe Webhook] Activating subscription for user:", instantDbUserId);
      console.log("[Stripe Webhook] Customer ID:", customerId);
      console.log("[Stripe Webhook] Subscription ID:", subscriptionId);

      // Note: The subscription status will be updated by the frontend
      // when the user returns from Stripe checkout, or via InstantDB Admin API
      // For now, we log the successful payment

      // Store payment info for manual verification if needed
      console.log("[Stripe Webhook] Payment successful for:", {
        instantDbUserId,
        email,
        customerId,
        subscriptionId,
        sessionId: session.id,
      });

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      console.log("[Stripe Webhook] Subscription canceled for customer:", customerId);
      // Handle subscription cancellation
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      console.log("[Stripe Webhook] Payment failed for customer:", customerId);
      // Handle payment failure
      break;
    }

    default:
      console.log("[Stripe Webhook] Unhandled event type:", event.type);
  }

  return c.json({ received: true });
});

/**
 * GET /api/stripe/session/:sessionId
 * Retrieves a Stripe Checkout Session to verify payment status
 */
stripeRouter.get("/session/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");

    if (!sessionId) {
      return c.json(
        { error: { message: "Session ID requis", code: "MISSING_SESSION_ID" } },
        400
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log("[Stripe] Session retrieved:", {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      metadata: session.metadata,
    });

    return c.json({
      data: {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email,
        metadata: session.metadata,
        customerId: session.customer,
        subscriptionId: session.subscription,
      },
    });
  } catch (error) {
    console.error("[Stripe] Error retrieving session:", error);
    return c.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Erreur lors de la récupération de la session",
          code: "STRIPE_ERROR",
        },
      },
      500
    );
  }
});

export { stripeRouter };

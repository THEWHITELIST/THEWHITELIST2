import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const config = {
  api: {
    bodyParser: false, // Required for webhook signature verification
  },
};

// Helper to get raw body
async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed", code: "METHOD_NOT_ALLOWED" } });
  }

  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return res.status(400).json({ error: { message: "Missing stripe-signature header", code: "MISSING_SIGNATURE" } });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);

    // Verify webhook signature if secret is configured
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      // In development, parse without verification (NOT RECOMMENDED FOR PRODUCTION)
      console.warn("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured, parsing without verification");
      event = JSON.parse(rawBody.toString()) as Stripe.Event;
    }
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return res.status(400).json({ error: { message: "Invalid signature", code: "INVALID_SIGNATURE" } });
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
        return res.status(400).json({ error: { message: "No user ID in metadata", code: "NO_USER_ID" } });
      }

      console.log("[Stripe Webhook] Activating subscription for user:", instantDbUserId);
      console.log("[Stripe Webhook] Customer ID:", customerId);
      console.log("[Stripe Webhook] Subscription ID:", subscriptionId);

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
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      console.log("[Stripe Webhook] Payment failed for customer:", customerId);
      break;
    }

    default:
      console.log("[Stripe Webhook] Unhandled event type:", event.type);
  }

  return res.status(200).json({ received: true });
}

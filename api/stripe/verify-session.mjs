import Stripe from "stripe";

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: { message: "Method not allowed", code: "METHOD_NOT_ALLOWED" } });
  }

  try {
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({
        error: { message: "Session ID requis", code: "MISSING_SESSION_ID" },
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log("[Stripe Verify] Session retrieved:", {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      metadata: session.metadata,
    });

    // Determine if subscription is active
    const isActive = session.payment_status === "paid" || session.payment_status === "no_payment_required";

    return res.status(200).json({
      data: {
        id: session.id,
        status: isActive ? "active" : "pending",
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email,
        metadata: session.metadata,
        customerId: session.customer,
        subscriptionId: session.subscription,
        updated: isActive,
      },
    });
  } catch (error) {
    console.error("[Stripe Verify] Error:", error);
    return res.status(500).json({
      error: {
        message: error instanceof Error ? error.message : "Erreur lors de la verification",
        code: "STRIPE_ERROR",
      },
    });
  }
}


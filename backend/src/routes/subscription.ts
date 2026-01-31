import { Hono } from "hono";
import { prisma } from "../prisma";
import { env } from "../env";
import type { AuthUser, AuthSession } from "../auth";

const subscriptionRouter = new Hono<{
  Variables: {
    user: AuthUser | null;
    session: AuthSession | null;
  };
}>();

// Helper to require authentication
function requireAuth(user: AuthUser | null): user is AuthUser {
  return user !== null;
}

/**
 * POST /api/subscription/start-trial
 * Start 14-day free trial for authenticated user
 */
subscriptionRouter.post("/start-trial", async (c) => {
  const user = c.get("user");

  if (!requireAuth(user)) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  // Check if user already has an active subscription or trial
  if (user.subscriptionStatus === "active") {
    return c.json(
      { error: { message: "Already have an active subscription", code: "ALREADY_SUBSCRIBED" } },
      400
    );
  }

  if (user.subscriptionStatus === "trial") {
    return c.json(
      { error: { message: "Already on trial", code: "ALREADY_ON_TRIAL" } },
      400
    );
  }

  // Calculate trial end date (14 days from now)
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  // Update user with trial status
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: "trial",
      trialEndsAt: trialEndsAt,
    },
  });

  return c.json({
    data: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      subscriptionStatus: updatedUser.subscriptionStatus,
      trialEndsAt: updatedUser.trialEndsAt,
    },
  });
});

/**
 * POST /api/subscription/webhook
 * Stripe webhook handler for subscription events
 */
subscriptionRouter.post("/webhook", async (c) => {
  const signature = c.req.header("stripe-signature");

  if (!signature) {
    return c.json({ error: { message: "Missing stripe-signature header", code: "MISSING_SIGNATURE" } }, 400);
  }

  // Get raw body for signature verification
  const rawBody = await c.req.text();

  // In production, you would verify the webhook signature using Stripe SDK:
  // const event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);

  // For now, parse the event directly (in production, always verify!)
  let event: {
    type: string;
    data: {
      object: {
        id: string;
        customer: string;
        subscription?: string;
        client_reference_id?: string;
        metadata?: { userId?: string };
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return c.json({ error: { message: "Invalid JSON payload", code: "INVALID_PAYLOAD" } }, 400);
  }

  // Handle checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Get user ID from client_reference_id or metadata
    const userId = session.client_reference_id || session.metadata?.userId;

    if (!userId) {
      console.error("Webhook: No userId found in checkout session", session.id);
      return c.json({ error: { message: "No userId in session", code: "NO_USER_ID" } }, 400);
    }

    // Update user with subscription details
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "active",
        stripeCustomerId: session.customer,
        subscriptionId: session.subscription || session.id,
        trialEndsAt: null, // Clear trial end since they're now active
      },
    });

    console.log(`Webhook: Activated subscription for user ${userId}`);
  }

  // Handle subscription deleted/canceled
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customerId = subscription.customer;

    // Find user by Stripe customer ID and mark as canceled
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: "canceled",
          subscriptionEndsAt: new Date(),
        },
      });
      console.log(`Webhook: Canceled subscription for user ${user.id}`);
    }
  }

  return c.json({ received: true });
});

/**
 * GET /api/subscription/status
 * Get current subscription status for authenticated user
 */
subscriptionRouter.get("/status", async (c) => {
  const user = c.get("user");

  if (!requireAuth(user)) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  // Get fresh user data from database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      subscriptionStatus: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
      stripeCustomerId: true,
      subscriptionId: true,
    },
  });

  if (!dbUser) {
    return c.json({ error: { message: "User not found", code: "USER_NOT_FOUND" } }, 404);
  }

  // Check if trial has expired
  let status = dbUser.subscriptionStatus;
  if (status === "trial" && dbUser.trialEndsAt && new Date() > dbUser.trialEndsAt) {
    // Trial has expired, update status
    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionStatus: "expired" },
    });
    status = "expired";
  }

  // Calculate days remaining for trial
  let trialDaysRemaining: number | null = null;
  if (status === "trial" && dbUser.trialEndsAt) {
    const now = new Date();
    const diff = dbUser.trialEndsAt.getTime() - now.getTime();
    trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return c.json({
    data: {
      subscriptionStatus: status,
      trialEndsAt: dbUser.trialEndsAt,
      trialDaysRemaining,
      subscriptionEndsAt: dbUser.subscriptionEndsAt,
      hasStripeCustomer: !!dbUser.stripeCustomerId,
      hasSubscription: !!dbUser.subscriptionId,
    },
  });
});

/**
 * POST /api/subscription/activate
 * Manually activate subscription after Stripe payment
 * For simplicity, just marks as active (in production would verify with Stripe)
 */
subscriptionRouter.post("/activate", async (c) => {
  const user = c.get("user");

  if (!requireAuth(user)) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  // Check if already active
  if (user.subscriptionStatus === "active") {
    return c.json(
      { error: { message: "Subscription already active", code: "ALREADY_ACTIVE" } },
      400
    );
  }

  // Update user to active status
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: "active",
      trialEndsAt: null, // Clear trial
    },
  });

  return c.json({
    data: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      subscriptionStatus: updatedUser.subscriptionStatus,
    },
  });
});

export { subscriptionRouter };

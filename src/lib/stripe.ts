import { loadStripe } from "@stripe/stripe-js";

// Stripe Publishable Key from environment variable
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

// Initialize Stripe
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

/**
 * Creates a Stripe Checkout Session and redirects the user to Stripe
 * @param instantDbUserId - The user ID from InstantDB
 * @param email - User's email address
 * @returns The checkout session URL
 */
export async function createCheckoutSession(
  instantDbUserId: string,
  email: string
): Promise<{ url: string; sessionId: string }> {
  console.log("[Stripe] Creating checkout session for user:", instantDbUserId);

  // Use relative path for Vercel deployment (API routes are at /api/*)
  const response = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      instantDbUserId,
      email,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Erreur lors de la création de la session de paiement");
  }

  const data = await response.json();
  console.log("[Stripe] Checkout session created:", data.data.sessionId);

  return {
    url: data.data.url,
    sessionId: data.data.sessionId,
  };
}

/**
 * Redirects the user to Stripe Checkout
 * @param instantDbUserId - The user ID from InstantDB
 * @param email - User's email address
 */
export async function redirectToCheckout(
  instantDbUserId: string,
  email: string
): Promise<void> {
  const { url } = await createCheckoutSession(instantDbUserId, email);

  // Redirect to Stripe Checkout
  window.location.href = url;
}

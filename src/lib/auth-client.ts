import { createAuthClient } from "better-auth/react";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const authClient = createAuthClient({
  baseURL: backendUrl,
  fetchOptions: {
    credentials: "include",
  },
});

export const { useSession, signOut } = authClient;

// Type for subscription status
export type SubscriptionStatus = "none" | "trial" | "active" | "canceled" | "expired";

// User type with subscription fields
export interface UserWithSubscription {
  subscriptionStatus?: SubscriptionStatus;
  trialEndsAt?: string | Date | null;
}

// Helper to check if user has active subscription
export function hasActiveSubscription(user: UserWithSubscription | null | undefined): boolean {
  if (!user) return false;
  const status = user.subscriptionStatus;

  if (status === "active") return true;

  if (status === "trial" && user.trialEndsAt) {
    return new Date(user.trialEndsAt) > new Date();
  }

  return false;
}

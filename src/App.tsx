import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { db, type UserProfile } from "@/lib/instantdb";
import LandingPage from "./pages/LandingPage";
import Welcome from "./pages/Welcome";
import Questionnaire from "./pages/Questionnaire";
import Program from "./pages/Program";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import PaywallScreen from "./pages/PaywallScreen";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Loading screen component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
}

// Protected routes wrapper
function ProtectedRoutes() {
  return (
    <Routes>
      <Route path="/app" element={<Welcome />} />
      <Route path="/questionnaire/:cityId" element={<Questionnaire />} />
      <Route path="/program/:id" element={<Program />} />
      <Route path="/history" element={<History />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      {/* Payment return pages - accessible when authenticated */}
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-canceled" element={<PaymentCanceled />} />
      {/* Redirect old / to /app for authenticated users */}
      <Route path="/" element={<Navigate to="/app" replace />} />
      {/* Redirect /login to /app when already authenticated */}
      <Route path="/login" element={<Navigate to="/app" replace />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Auth screens wrapper (Login/SignUp)
function AuthScreens() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <Login onSwitchToSignUp={() => setAuthMode("signup")} />
        }
      />
      <Route
        path="/signup"
        element={
          <SignUp onSwitchToLogin={() => setAuthMode("login")} />
        }
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-canceled" element={<PaymentCanceled />} />
      {/* Redirect any authenticated routes to login when not logged in */}
      <Route path="/app" element={<Navigate to="/login" replace />} />
      <Route path="/questionnaire/*" element={<Navigate to="/login" replace />} />
      <Route path="/program/*" element={<Navigate to="/login" replace />} />
      <Route path="/history" element={<Navigate to="/login" replace />} />
      <Route path="/settings" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Subscription check wrapper
function SubscriptionWrapper({ user }: { user: { id: string; email?: string | null } }) {
  // Query user profile to check subscription status
  const { data: profileData, isLoading: profileLoading } = db.useQuery({
    userProfiles: {
      $: {
        where: {
          odukiogaUserId: user.id,
        },
      },
    },
  });

  const userProfile = profileData?.userProfiles?.[0] as UserProfile | undefined;

  // Show loading while fetching profile
  if (profileLoading) {
    return <LoadingScreen />;
  }

  // If no profile found, user needs to complete signup
  if (!userProfile) {
    console.log("[SubscriptionWrapper] No profile found for user:", user.id);
    // Sign out and redirect to login
    db.auth.signOut();
    return <AuthScreens />;
  }

  // GARDE-FOU: Check subscription status
  const subscriptionStatus = userProfile.subscriptionStatus || "unpaid";

  console.log("[SubscriptionWrapper] User subscription status:", subscriptionStatus);

  // If subscription is unpaid, show paywall
  if (subscriptionStatus === "unpaid") {
    return (
      <BrowserRouter>
        <Routes>
          {/* Allow payment pages even for unpaid users */}
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-canceled" element={<PaymentCanceled />} />
          {/* Allow password update for users coming from reset flow */}
          <Route path="/update-password" element={<UpdatePassword />} />
          {/* All other routes show paywall */}
          <Route
            path="*"
            element={
              <PaywallScreen
                userProfile={userProfile}
                onLogout={() => {
                  // Force re-render by navigating
                  window.location.href = "/login";
                }}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    );
  }

  // If subscription is canceled, also show paywall (with different message if needed)
  if (subscriptionStatus === "canceled") {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-canceled" element={<PaymentCanceled />} />
          {/* Allow password update for users coming from reset flow */}
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route
            path="*"
            element={
              <PaywallScreen
                userProfile={userProfile}
                onLogout={() => {
                  window.location.href = "/login";
                }}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    );
  }

  // Subscription is active - show protected routes
  return (
    <BrowserRouter>
      <ProtectedRoutes />
    </BrowserRouter>
  );
}

// Auth wrapper using InstantDB
function AuthWrapper() {
  const { isLoading, error, user } = db.useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    console.error("Auth error:", error);
    return (
      <BrowserRouter>
        <AuthScreens />
      </BrowserRouter>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <AuthScreens />
      </BrowserRouter>
    );
  }

  // User is authenticated, check subscription
  return <SubscriptionWrapper user={user} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthWrapper />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

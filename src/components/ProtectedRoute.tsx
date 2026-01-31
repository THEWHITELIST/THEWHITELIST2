import { Navigate, useLocation } from "react-router-dom";
import { useSession, hasActiveSubscription, type UserWithSubscription } from "@/lib/auth-client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  // Show elegant loading state
  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground text-sm tracking-wide">
            Verification en cours...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!session?.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but no active subscription - redirect to paywall
  const user = session.user as UserWithSubscription;
  if (!hasActiveSubscription(user)) {
    return <Navigate to="/paywall" state={{ from: location }} replace />;
  }

  // User is authenticated and has active subscription
  return <>{children}</>;
}

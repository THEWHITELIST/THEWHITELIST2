import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/lib/auth-client";

interface GuestRouteProps {
  children: React.ReactNode;
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  // Show elegant loading state
  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground text-sm tracking-wide">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  // User is logged in - redirect to dashboard or intended destination
  if (session?.user) {
    const from = (location.state as { from?: Location })?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  // User is not logged in - show the guest content
  return <>{children}</>;
}

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db, type UserProfile } from "@/lib/instantdb";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Crown, Loader2, ArrowRight, AlertTriangle } from "lucide-react";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);
  const { user, isLoading: authLoading } = db.useAuth();

  // Get session ID from URL
  const sessionId = searchParams.get("session_id");

  // Verify payment and activate subscription
  useEffect(() => {
    const verifyAndActivate = async () => {
      if (!sessionId) {
        console.log("[PaymentSuccess] No session_id in URL");
        setIsLoading(false);
        return;
      }

      setIsActivating(true);

      try {
        console.log("[PaymentSuccess] Verifying session:", sessionId);

        // Fetch session details from API (relative path for Vercel)
        const response = await fetch(`/api/stripe/session?sessionId=${sessionId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Impossible de vérifier le paiement");
        }

        const data = await response.json();
        const session = data.data;

        console.log("[PaymentSuccess] Session data:", session);

        // Check payment status - "paid" for immediate payment, "no_payment_required" for trial
        if (session.paymentStatus !== "paid" && session.paymentStatus !== "no_payment_required") {
          setError("Le paiement n'a pas été confirmé. Veuillez réessayer.");
          setIsLoading(false);
          setIsActivating(false);
          return;
        }

        // Get user ID from metadata
        const instantDbUserId = session.metadata?.instant_db_user_id;

        if (instantDbUserId) {
          console.log("[PaymentSuccess] Activating subscription for user:", instantDbUserId);

          // Update user profile in InstantDB
          await db.transact(
            db.tx.userProfiles[instantDbUserId].update({
              subscriptionStatus: "active",
              stripeCustomerId: session.customerId || undefined,
              stripeSessionId: session.id,
            })
          );

          console.log("[PaymentSuccess] Subscription activated!");
          setActivated(true);
        }
      } catch (err) {
        console.error("[PaymentSuccess] Error:", err);
        setError(err instanceof Error ? err.message : "Erreur lors de la vérification du paiement");
      } finally {
        setIsLoading(false);
        setIsActivating(false);
      }
    };

    if (!authLoading) {
      verifyAndActivate();
    }
  }, [sessionId, authLoading]);

  // Countdown for auto-redirect
  useEffect(() => {
    if (!isLoading && !error && activated) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/login", { replace: true });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLoading, error, activated, navigate]);

  const handleContinue = () => {
    navigate("/login", { replace: true });
  };

  if (isLoading || isActivating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isActivating ? "Activation de votre abonnement..." : "Validation du paiement..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-destructive/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/20 border border-destructive/30 mb-8">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>

            <h1 className="font-serif text-display-md text-foreground mb-4">
              <span className="text-gold-gradient">Erreur de paiement</span>
            </h1>

            <p className="text-muted-foreground mb-8">{error}</p>

            <Button
              onClick={() => navigate("/login", { replace: true })}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Retour à la connexion
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          {/* Success icon */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
          </div>

          {/* Header */}
          <div className="mb-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 mb-6">
              <Crown className="w-4 h-4 text-emerald-500" />
              <span className="text-xs tracking-widest uppercase text-emerald-500 font-medium">
                Paiement validé
              </span>
            </div>

            <h1 className="font-serif text-display-md md:text-display-lg text-foreground mb-4">
              <span className="text-gold-gradient">Bienvenue dans</span>
              <br />
              <span className="text-gold-gradient">THE WHITE LIST</span>
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed">
              Votre abonnement Premium est maintenant actif.
              <br />
              Vous avez accès à toutes les fonctionnalités.
            </p>
          </div>

          {/* Success card */}
          <div className="bg-card border border-emerald-500/20 rounded-2xl p-6 mb-8 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-center gap-3 text-emerald-500 mb-4">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Abonnement Premium activé</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Merci pour votre confiance. Vous pouvez maintenant créer des itinéraires personnalisés pour vos clients.
            </p>
          </div>

          {/* CTA button */}
          <Button
            onClick={handleContinue}
            className="w-full h-14 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group animate-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            <span className="flex items-center gap-2">
              Se connecter
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
          </Button>

          {/* Auto redirect notice */}
          <p className="mt-4 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "400ms" }}>
            Redirection automatique dans {countdown} seconde{countdown > 1 ? "s" : ""}...
          </p>

          {/* Footer */}
          <p className="mt-8 text-xs text-muted-foreground/70 tracking-wide animate-fade-up" style={{ animationDelay: "500ms" }}>
            THE WHITE LIST — Votre partenaire conciergerie de luxe
          </p>
        </div>
      </div>
    </div>
  );
}

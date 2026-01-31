import { useState } from "react";
import { db, type UserProfile } from "@/lib/instantdb";
import { redirectToCheckout } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import SmartLogo from "@/components/SmartLogo";
import {
  CreditCard,
  Loader2,
  ArrowRight,
  AlertTriangle,
  Crown,
  Lock,
  LogOut,
} from "lucide-react";

interface PaywallProps {
  userProfile: UserProfile;
  onLogout: () => void;
}

export default function Paywall({ userProfile, onLogout }: PaywallProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("[Paywall] Redirecting to Stripe Checkout for user:", userProfile.id);
      await redirectToCheckout(userProfile.id, userProfile.email);
    } catch (err) {
      console.error("[Paywall] Stripe error:", err);
      setError("Erreur lors de la connexion à Stripe. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await db.auth.signOut();
      onLogout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* SmartLogo at top center */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
          <SmartLogo />
        </div>

        <div className="w-full max-w-md text-center">
          {/* Lock icon */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/30 mb-8">
              <Lock className="w-10 h-10 text-amber-500" />
            </div>
          </div>

          {/* Header */}
          <div className="mb-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/20 bg-amber-500/10 mb-6">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-xs tracking-widest uppercase text-amber-500 font-medium">
                Abonnement requis
              </span>
            </div>

            <h1 className="font-serif text-display-md md:text-display-lg text-foreground mb-4">
              <span className="text-gold-gradient">Activez votre</span>
              <br />
              <span className="text-gold-gradient">abonnement</span>
            </h1>

            <p className="text-muted-foreground text-base leading-relaxed">
              Bonjour <span className="text-primary font-medium">{userProfile.firstName}</span>,
              <br />
              votre compte a été créé mais nécessite un abonnement actif pour accéder à l'outil.
            </p>
          </div>

          {/* Pricing card */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 mb-6 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <h3 className="text-lg font-medium text-foreground">THE WHITE LIST Premium</h3>
                <p className="text-sm text-muted-foreground">Accès illimité à l'outil de conciergerie</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">249,99€</span>
                <span className="text-muted-foreground text-sm">/mois</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                2 semaines d'essai offertes
              </span>
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                Sans engagement
              </span>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Création illimitée d'itinéraires
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Export PDF professionnel multilingue
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Historique des séjours sauvegardé
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Support prioritaire
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-6 animate-fade-in">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          {/* Payment button */}
          <Button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full h-14 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group animate-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Redirection vers Stripe...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Activer mon abonnement
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </Button>

          {/* Logout link */}
          <button
            onClick={handleLogout}
            className="mt-6 text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 mx-auto animate-fade-up"
            style={{ animationDelay: "400ms" }}
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>

          {/* Footer */}
          <p className="mt-8 text-xs text-muted-foreground/70 tracking-wide animate-fade-up" style={{ animationDelay: "500ms" }}>
            Paiement sécurisé par Stripe
          </p>
        </div>
      </div>
    </div>
  );
}

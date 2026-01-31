import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowRight, RefreshCw, HelpCircle } from "lucide-react";

export default function PaymentCanceled() {
  const navigate = useNavigate();

  const handleRetry = () => {
    // Retourner vers l'inscription pour réessayer le paiement
    navigate("/login", { replace: true });
  };

  const handleLogin = () => {
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-destructive/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          {/* Error icon */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/20 border border-destructive/30 mb-8">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
          </div>

          {/* Header */}
          <div className="mb-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-destructive/20 bg-destructive/10 mb-6">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-xs tracking-widest uppercase text-destructive font-medium">
                Paiement non validé
              </span>
            </div>

            <h1 className="font-serif text-display-md md:text-display-lg text-foreground mb-4">
              <span className="text-gold-gradient">Paiement</span>
              <br />
              <span className="text-gold-gradient">interrompu</span>
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed">
              Le paiement n'a pas pu être validé.
              <br />
              Veuillez réessayer pour activer votre compte.
            </p>
          </div>

          {/* Error card */}
          <div className="bg-card border border-destructive/20 rounded-2xl p-6 mb-8 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-center gap-3 text-destructive mb-4">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Le paiement n'a pas pu être validé.</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Cela peut arriver pour plusieurs raisons :
            </p>
            <ul className="text-sm text-muted-foreground text-left space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">•</span>
                Le paiement a été annulé manuellement
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">•</span>
                Fonds insuffisants sur la carte
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">•</span>
                La carte a été refusée par votre banque
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 animate-fade-up" style={{ animationDelay: "300ms" }}>
            <Button
              onClick={handleRetry}
              className="w-full h-14 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group"
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Réessayer le paiement
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>

            <Button
              onClick={handleLogin}
              variant="outline"
              className="w-full h-12 text-base font-medium border-border/50 hover:bg-card transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                Retour à la connexion
              </span>
            </Button>
          </div>

          {/* Help section */}
          <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border/50 animate-fade-up" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Besoin d'aide ?</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Si le problème persiste, contactez notre support à{" "}
              <a href="mailto:support@thewhitelist.fr" className="text-primary hover:underline">
                support@thewhitelist.fr
              </a>
            </p>
          </div>

          {/* Footer */}
          <p className="mt-8 text-xs text-muted-foreground/70 tracking-wide animate-fade-up" style={{ animationDelay: "500ms" }}>
            THE WHITE LIST — Votre partenaire conciergerie de luxe
          </p>
        </div>
      </div>
    </div>
  );
}

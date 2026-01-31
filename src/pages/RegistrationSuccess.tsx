import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";

export default function RegistrationSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Animated success icon */}
        <div
          className="mb-8 relative inline-block animate-fade-up"
          style={{ animationDelay: "0ms" }}
        >
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
          <div className="relative inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Main title */}
        <h1
          className="font-serif text-3xl md:text-4xl text-foreground mb-6 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          Votre paiement a bien été accepté
        </h1>

        {/* Explanation paragraphs */}
        <div
          className="space-y-4 mb-8 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <p className="text-muted-foreground text-base leading-relaxed">
            Afin de garantir à chaque établissement un service haut de gamme, nous procédons à une vérification manuelle de chaque demande. Cette vérification peut prendre jusqu'à 6 heures.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            Cette étape nous permet de nous assurer que l'établissement correspond aux standards de qualité et d'excellence de notre service.
          </p>
        </div>

        {/* Email instruction card */}
        <div
          className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 mb-8 animate-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="text-foreground font-medium mb-1">Prochaine étape</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Nous vous invitons à <span className="text-emerald-500 font-medium">surveiller vos emails</span> pour être informé de la validation de votre demande.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div
          className="animate-fade-up"
          style={{ animationDelay: "400ms" }}
        >
          <Button
            onClick={() => navigate("/", { replace: true })}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all duration-300"
          >
            Retour à l'accueil
          </Button>
        </div>

        {/* Footer reassurance */}
        <div
          className="mt-8 pt-6 border-t border-border/50 animate-fade-up"
          style={{ animationDelay: "500ms" }}
        >
          <div className="flex items-start justify-center gap-2 text-muted-foreground/70">
            <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs leading-relaxed text-left">
              Important : Si la demande n'est pas validée par nos équipes, aucun paiement ne sera prélevé et l'abonnement sera immédiatement annulé.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

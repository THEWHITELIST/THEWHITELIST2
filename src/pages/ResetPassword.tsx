import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db, type UserProfile } from "@/lib/instantdb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SmartLogo from "@/components/SmartLogo";
import {
  ArrowRight,
  Loader2,
  Mail,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Send,
  KeyRound,
} from "lucide-react";

/**
 * FLUX DE RÉINITIALISATION DU MOT DE PASSE - V18
 *
 * InstantDB utilise des Magic Codes (codes numériques) et non des Magic Links.
 * Flux en 3 étapes:
 * 1. Saisie de l'email -> Vérification DB -> Envoi du Magic Code
 * 2. Saisie du code reçu par email -> Validation
 * 3. Une fois authentifié -> Redirection vers /update-password
 */

type ResetStep = "email" | "code" | "sent";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // États du flux
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [magicCode, setMagicCode] = useState("");

  // États UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // État pour savoir si l'utilisateur existe
  const [userExists, setUserExists] = useState<boolean | null>(null);

  // Pré-remplir l'email depuis l'URL si présent
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Query pour vérifier si l'utilisateur existe dans la DB
  const { data: profileData, isLoading: isQueryLoading } = db.useQuery({
    userProfiles: {
      $: {
        where: {
          email: email.trim().toLowerCase(),
        },
      },
    },
  });

  // Mettre à jour userExists quand les données changent
  useEffect(() => {
    if (email.trim() && !isQueryLoading && profileData) {
      const exists = (profileData?.userProfiles?.length ?? 0) > 0;
      setUserExists(exists);
    } else {
      setUserExists(null);
    }
  }, [profileData, isQueryLoading, email]);

  // ÉTAPE 1: Vérifier l'email et envoyer le Magic Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation de l'email
    if (!email.trim() || !email.includes("@")) {
      setError("Veuillez entrer une adresse e-mail valide.");
      return;
    }

    // Attendre que la query soit terminée
    if (isQueryLoading) {
      setError("Vérification en cours, veuillez patienter...");
      return;
    }

    // VÉRIFICATION: Le compte existe-t-il ?
    if (!userExists) {
      setError("Aucun compte n'est associé à cette adresse e-mail.");
      return;
    }

    setIsLoading(true);

    try {
      // Envoyer le Magic Code via InstantDB
      console.log("[ResetPassword] Sending Magic Code to:", email.trim().toLowerCase());

      await db.auth.sendMagicCode({ email: email.trim().toLowerCase() });

      // Passer à l'écran de saisie du code
      setStep("code");
      setError(null);

    } catch (err) {
      console.error("Erreur envoi code:", err);
      setError("Erreur lors de l'envoi du code. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // ÉTAPE 2: Vérifier le Magic Code et authentifier
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!magicCode.trim() || magicCode.length < 6) {
      setError("Veuillez entrer le code à 6 chiffres reçu par email.");
      return;
    }

    setIsLoading(true);

    try {
      // Vérifier le Magic Code - cela connecte l'utilisateur
      console.log("[ResetPassword] Verifying Magic Code...");

      await db.auth.signInWithMagicCode({
        email: email.trim().toLowerCase(),
        code: magicCode.trim()
      });

      // Authentification réussie - rediriger vers la page de changement de mot de passe
      console.log("[ResetPassword] Magic Code verified, redirecting to /update-password");
      navigate("/update-password", { replace: true });

    } catch (err) {
      console.error("Erreur vérification code:", err);
      setError("Code invalide ou expiré. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Renvoyer le code
  const handleResendCode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await db.auth.sendMagicCode({ email: email.trim().toLowerCase() });
      setSuccessMessage("Un nouveau code a été envoyé à votre adresse email.");
    } catch (err) {
      console.error("Erreur renvoi code:", err);
      setError("Erreur lors du renvoi. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* SmartLogo at top center */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
          <SmartLogo />
        </div>

        <div className="w-full max-w-md">
          {/* ============================================= */}
          {/* ÉTAPE 1: SAISIE DE L'EMAIL */}
          {/* ============================================= */}
          {step === "email" && (
            <>
              {/* Header */}
              <div className="text-center mb-10 animate-fade-up">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
                  <Shield className="w-8 h-8 text-primary" />
                </div>

                <h1 className="font-serif text-display-md md:text-display-lg text-foreground mb-3">
                  <span className="text-gold-gradient">Mot de passe oublié</span>
                </h1>

                <p className="text-muted-foreground text-base leading-relaxed">
                  Entrez votre adresse e-mail pour recevoir un code de vérification.
                </p>
              </div>

              <form onSubmit={handleSendCode} className="space-y-5 animate-fade-up" style={{ animationDelay: "100ms" }}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    Votre adresse e-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jean.dupont@hotel.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    className="bg-card border-border/50 focus:border-primary/50 transition-colors h-12"
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                {/* Message d'erreur */}
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-fade-in">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || isQueryLoading}
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group"
                >
                  {isLoading || isQueryLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isQueryLoading ? "Vérification..." : "Envoi en cours..."}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Envoyer le code de vérification
                    </span>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  ← Retour à la connexion
                </button>
              </form>
            </>
          )}

          {/* ============================================= */}
          {/* ÉTAPE 2: SAISIE DU CODE */}
          {/* ============================================= */}
          {step === "code" && (
            <>
              {/* Header */}
              <div className="text-center mb-10 animate-fade-up">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>

                <h1 className="font-serif text-display-md md:text-display-lg text-foreground mb-3">
                  <span className="text-gold-gradient">Vérification</span>
                </h1>

                <p className="text-muted-foreground text-base leading-relaxed">
                  Un code a été envoyé à{" "}
                  <span className="text-primary font-medium">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-5 animate-fade-up" style={{ animationDelay: "100ms" }}>
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm text-muted-foreground flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5" />
                    Code de vérification (6 chiffres)
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    value={magicCode}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setMagicCode(value);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="bg-card border-border/50 focus:border-primary/50 transition-colors h-12 text-center text-2xl tracking-[0.5em] font-mono"
                    disabled={isLoading}
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                  />
                </div>

                {/* Message de succès */}
                {successMessage && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-fade-in">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-emerald-500">{successMessage}</p>
                    </div>
                  </div>
                )}

                {/* Message d'erreur */}
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-fade-in">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || magicCode.length < 6}
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Vérification...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Valider et continuer
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Vous n'avez pas reçu le code ?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm text-primary hover:underline transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Envoi en cours..." : "Renvoyer le code"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setMagicCode("");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  ← Changer d'adresse email
                </button>
              </form>
            </>
          )}

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground/70 tracking-wide animate-fade-up" style={{ animationDelay: "200ms" }}>
            THE WHITE LIST — Réinitialisation sécurisée
          </p>
        </div>
      </div>
    </div>
  );
}

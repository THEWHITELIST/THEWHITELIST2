import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { db, hashPassword, type UserProfile } from "@/lib/instantdb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SmartLogo from "@/components/SmartLogo";
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, Shield } from "lucide-react";

type AuthStep = "credentials" | "code";

interface LoginProps {
  onSwitchToSignUp?: () => void; // Optional for backwards compatibility
}

export default function Login({ onSwitchToSignUp }: LoginProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Query user profile by email for password verification
  const { data: profileData } = db.useQuery({
    userProfiles: {
      $: {
        where: {
          email: email.trim().toLowerCase(),
        },
      },
    },
  });

  const userProfile = profileData?.userProfiles?.[0] as UserProfile | undefined;

  const handleVerifyCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Veuillez entrer une adresse e-mail valide");
      return;
    }
    if (!password) {
      setError("Veuillez entrer votre mot de passe");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if user profile exists
      if (!userProfile) {
        setError("Aucun compte trouvé avec cet e-mail. Veuillez créer un compte.");
        setIsLoading(false);
        return;
      }

      // Verify password
      const hashedInput = await hashPassword(password);
      if (hashedInput !== userProfile.passwordHash) {
        setError("Mot de passe incorrect");
        setIsLoading(false);
        return;
      }

      // Password correct, send magic code for 2FA
      await db.auth.sendMagicCode({ email: email.trim().toLowerCase() });
      setStep("code");
    } catch (err) {
      console.error("Error verifying credentials:", err);
      setError("Erreur lors de la vérification. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Veuillez entrer le code reçu");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await db.auth.signInWithMagicCode({ email: email.trim().toLowerCase(), code: code.trim() });
      // Authentication successful - the app will re-render with the authenticated state
    } catch (err) {
      console.error("Error verifying code:", err);
      setError("Code invalide ou expiré. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep("credentials");
    setCode("");
    setError(null);
  };

  const handleForgotPassword = () => {
    // Navigate to dedicated reset password page with email pre-filled
    const emailParam = email.trim() ? `?email=${encodeURIComponent(email.trim().toLowerCase())}` : "";
    navigate(`/reset-password${emailParam}`);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background elements */}
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
          {/* Header */}
          <div className="text-center mb-10 animate-fade-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs tracking-widest uppercase text-primary font-medium">
                {step === "credentials" ? "Étape 1/2" : "Étape 2/2"}
              </span>
            </div>

            <h1 className="font-serif text-display-md md:text-display-lg text-foreground mb-3">
              <span className="text-gold-gradient">
                {step === "credentials" ? "Connexion" : "Vérification 2FA"}
              </span>
            </h1>

            <p className="text-muted-foreground text-base leading-relaxed">
              {step === "credentials"
                ? "Entrez vos identifiants pour continuer"
                : <>Un code de sécurité a été envoyé à <span className="text-primary">{email}</span></>
              }
            </p>
          </div>

          {/* Form */}
          {step === "credentials" ? (
            <form onSubmit={handleVerifyCredentials} className="space-y-5 animate-fade-up" style={{ animationDelay: "100ms" }}>
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  Email professionnel
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

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-muted-foreground flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="bg-card border-border/50 focus:border-primary/50 transition-colors h-12 pr-10"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot password link */}
              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-fade-in">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Vérification...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Continuer
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>

              {/* Switch to signup */}
              <p className="text-center text-sm text-muted-foreground mt-4">
                Pas encore de compte ?{" "}
                <Link
                  to="/signup"
                  className="text-primary hover:underline font-medium"
                >
                  Créer un compte
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-5 animate-fade-up" style={{ animationDelay: "100ms" }}>
              {/* 2FA Info */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mb-4">
                <p className="text-sm text-muted-foreground text-center">
                  Pour sécuriser votre compte, un code de vérification a été envoyé à votre adresse e-mail.
                </p>
              </div>

              {/* Code */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm text-muted-foreground flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5" />
                  Code de sécurité
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError(null);
                  }}
                  className="bg-card border-border/50 focus:border-primary/50 transition-colors h-12 text-center tracking-[0.5em] text-lg font-mono"
                  disabled={isLoading}
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-fade-in">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Vérification...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Se connecter
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>

              {/* Back button */}
              <button
                type="button"
                onClick={handleBackToCredentials}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                disabled={isLoading}
              >
                ← Retour aux identifiants
              </button>
            </form>
          )}

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground/70 tracking-wide animate-fade-up" style={{ animationDelay: "200ms" }}>
            Connexion sécurisée avec double authentification
          </p>
        </div>
      </div>
    </div>
  );
}

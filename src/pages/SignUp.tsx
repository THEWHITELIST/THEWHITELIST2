import { useState } from "react";
import { Link } from "react-router-dom";
import { db, hashPassword, type UserProfile } from "@/lib/instantdb";
import { id } from "@instantdb/react";
import { redirectToCheckout } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SmartLogo from "@/components/SmartLogo";
import {
  ArrowRight,
  Building2,
  KeyRound,
  Loader2,
  Mail,
  Shield,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

type SignUpStep = "form" | "verify" | "payment";

interface FormData {
  firstName: string;
  lastName: string;
  hotelName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignUpProps {
  onSwitchToLogin?: () => void; // Optional for backwards compatibility
}

export default function SignUp({ onSwitchToLogin }: SignUpProps) {
  const [step, setStep] = useState<SignUpStep>("form");
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    hotelName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordHash, setPasswordHash] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  // Query to check if email already exists
  const { data: existingProfileData } = db.useQuery({
    userProfiles: {
      $: {
        where: {
          email: formData.email.trim().toLowerCase(),
        },
      },
    },
  });

  const existingProfile = existingProfileData?.userProfiles?.[0] as UserProfile | undefined;

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError("Veuillez entrer votre prénom");
      return false;
    }
    if (!formData.lastName.trim()) {
      setError("Veuillez entrer votre nom");
      return false;
    }
    if (!formData.hotelName.trim()) {
      setError("Veuillez entrer le nom de votre hôtel");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Veuillez entrer une adresse e-mail valide");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return false;
    }
    return true;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      // CRITICAL: Check if email already exists in database
      if (existingProfile) {
        setError("Ce compte existe déjà. Veuillez vous connecter.");
        setIsLoading(false);
        return;
      }

      // Hash the password before sending magic code
      const hashedPwd = await hashPassword(formData.password);
      setPasswordHash(hashedPwd);

      console.log("[SignUp] Sending magic code for:", formData.email.trim().toLowerCase());

      // Send magic code for email verification
      await db.auth.sendMagicCode({ email: formData.email.trim().toLowerCase() });
      setStep("verify");
    } catch (err) {
      console.error("Error sending verification code:", err);
      setError("Erreur lors de l'envoi du code. Veuillez réessayer.");
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
      console.log("[SignUp] Verifying magic code...");

      // Sign in with magic code (this creates the auth user)
      const result = await db.auth.signInWithMagicCode({
        email: formData.email.trim().toLowerCase(),
        code: code.trim()
      });

      if (result.user) {
        console.log("[SignUp] User authenticated:", result.user.id);

        // Generate a unique ID for the user profile
        const profileId = id();
        setCreatedUserId(profileId);

        // Create user profile in our database with hashed password
        // Set subscriptionStatus to 'unpaid' - user must complete Stripe payment
        await db.transact(
          db.tx.userProfiles[profileId].update({
            odukiogaUserId: result.user.id,
            email: formData.email.trim().toLowerCase(),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            hotelName: formData.hotelName.trim(),
            passwordHash: passwordHash,
            subscriptionStatus: "unpaid", // Set to unpaid by default
            createdAt: Date.now(),
          })
        );

        console.log("[SignUp] User profile created with ID:", profileId);

        // User stays logged in - move to payment step
        // User will manually click "Proceder au paiement" to go to Stripe
        setStep("payment");
      }
    } catch (err) {
      console.error("Error verifying code:", err);
      setError("Code invalide ou expiré. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!createdUserId) {
      setError("Erreur: ID utilisateur non trouvé. Veuillez vous reconnecter.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("[SignUp] Retrying Stripe Checkout...");
      await redirectToCheckout(createdUserId, formData.email.trim().toLowerCase());
    } catch (stripeError) {
      console.error("[SignUp] Stripe retry error:", stripeError);
      setError("Erreur lors de la connexion à Stripe. Veuillez réessayer plus tard.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setError(null);
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
          <div className="text-center mb-8 animate-fade-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
              {step === "payment" ? (
                <CreditCard className="w-8 h-8 text-primary" />
              ) : (
                <Shield className="w-8 h-8 text-primary" />
              )}
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs tracking-widest uppercase text-primary font-medium">
                {step === "form" ? "Étape 1/3" : step === "verify" ? "Étape 2/3" : "Étape 3/3"}
              </span>
            </div>

            <h1 className="font-serif text-display-md md:text-display-lg text-foreground mb-3">
              <span className="text-gold-gradient">
                {step === "form" ? "Inscription" : step === "verify" ? "Vérification" : "Paiement"}
              </span>
            </h1>

            <p className="text-muted-foreground text-base leading-relaxed">
              {step === "form"
                ? "Créez votre compte concierge pour accéder à l'outil"
                : step === "verify"
                  ? <>Un code a été envoyé à <span className="text-primary">{formData.email}</span></>
                  : "Finalisez votre inscription en procédant au paiement"}
            </p>
          </div>

          {/* Form */}
          {step === "form" ? (
            <form onSubmit={handleSubmitForm} className="space-y-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    Prénom
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={handleInputChange("firstName")}
                    className="bg-card border-border/50 focus:border-primary/50 transition-colors h-11"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm text-muted-foreground">
                    Nom
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={handleInputChange("lastName")}
                    className="bg-card border-border/50 focus:border-primary/50 transition-colors h-11"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Hotel Name */}
              <div className="space-y-2">
                <Label htmlFor="hotelName" className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" />
                  Nom de l'hôtel
                </Label>
                <Input
                  id="hotelName"
                  type="text"
                  placeholder="Hôtel Le Bristol Paris"
                  value={formData.hotelName}
                  onChange={handleInputChange("hotelName")}
                  className="bg-card border-border/50 focus:border-primary/50 transition-colors h-11"
                  disabled={isLoading}
                />
              </div>

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
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  className="bg-card border-border/50 focus:border-primary/50 transition-colors h-11"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-muted-foreground flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5" />
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="8 caractères minimum"
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    className="bg-card border-border/50 focus:border-primary/50 transition-colors h-11 pr-10"
                    disabled={isLoading}
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

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Répétez le mot de passe"
                    value={formData.confirmPassword}
                    onChange={handleInputChange("confirmPassword")}
                    className="bg-card border-border/50 focus:border-primary/50 transition-colors h-11 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
                className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Créer mon compte
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>

              {/* Switch to login */}
              <p className="text-center text-sm text-muted-foreground mt-4">
                Déjà un compte ?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Se connecter
                </Link>
              </p>
            </form>
          ) : step === "verify" ? (
            <form onSubmit={handleVerifyCode} className="space-y-5 animate-fade-up" style={{ animationDelay: "100ms" }}>
              {/* Code */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm text-muted-foreground flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5" />
                  Code de vérification
                </Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(value);
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
                disabled={isLoading || code.length !== 6}
                className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Vérification...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Vérifier et continuer
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>

              {/* Back button */}
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setCode("");
                  setError(null);
                }}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                disabled={isLoading}
              >
                ← Modifier mes informations
              </button>
            </form>
          ) : (
            /* Payment step - shown if Stripe redirect fails */
            <div className="space-y-5 animate-fade-up" style={{ animationDelay: "100ms" }}>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <CreditCard className="w-10 h-10 text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Votre compte a été créé avec succès.
                  <br />
                  Veuillez procéder au paiement pour activer votre abonnement.
                </p>
              </div>

              {/* Pricing info */}
              <div className="p-4 rounded-lg bg-card border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground font-medium">Abonnement Premium</span>
                  <span className="text-primary font-bold">249,99€/mois</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    2 semaines d'essai offertes
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                    Sans engagement
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Accès illimité à l'outil de conciergerie de luxe THE WHITE LIST
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </div>
              )}

              {/* Payment button */}
              <Button
                onClick={handleRetryPayment}
                disabled={isLoading}
                className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirection...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Procéder au paiement
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>

              {/* Login link */}
              <p className="text-center text-sm text-muted-foreground">
                Vous avez déjà payé ?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          )}

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-muted-foreground/70 tracking-wide animate-fade-up" style={{ animationDelay: "200ms" }}>
            En créant un compte, vous acceptez nos conditions d'utilisation
          </p>
        </div>
      </div>
    </div>
  );
}

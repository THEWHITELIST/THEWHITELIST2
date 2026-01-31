import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, hashPassword, type UserProfile } from "@/lib/instantdb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SmartLogo from "@/components/SmartLogo";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

/**
 * PAGE DE MISE À JOUR DU MOT DE PASSE - V18
 *
 * Cette page est accessible uniquement après authentification via Magic Code.
 * L'utilisateur définit son nouveau mot de passe ici.
 *
 * Route protégée: /update-password
 */

export default function UpdatePassword() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = db.useAuth();

  // États du formulaire
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // États UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Query pour récupérer le profil utilisateur
  const { data: profileData, isLoading: profileLoading } = db.useQuery(
    user
      ? {
          userProfiles: {
            $: {
              where: {
                odukiogaUserId: user.id,
              },
            },
          },
        }
      : null
  );

  const userProfile = profileData?.userProfiles?.[0] as UserProfile | undefined;

  // Rediriger si non authentifié
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("[UpdatePassword] User not authenticated, redirecting to login");
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Validation du mot de passe
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Le mot de passe doit contenir au moins 8 caractères.";
    }
    if (!/[A-Z]/.test(password)) {
      return "Le mot de passe doit contenir au moins une majuscule.";
    }
    if (!/[a-z]/.test(password)) {
      return "Le mot de passe doit contenir au moins une minuscule.";
    }
    if (!/[0-9]/.test(password)) {
      return "Le mot de passe doit contenir au moins un chiffre.";
    }
    return null;
  };

  // Mise à jour du mot de passe
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!newPassword || !confirmPassword) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!userProfile) {
      setError("Profil utilisateur introuvable. Veuillez réessayer.");
      return;
    }

    setIsLoading(true);

    try {
      // Hasher le nouveau mot de passe
      const newPasswordHash = await hashPassword(newPassword);

      // Mettre à jour le profil avec le nouveau hash
      await db.transact(
        db.tx.userProfiles[userProfile.id].update({
          passwordHash: newPasswordHash,
        })
      );

      console.log("[UpdatePassword] Password updated successfully");
      setSuccess(true);

      // Afficher notification de succès
      toast.success("Mot de passe mis à jour avec succès !");

      // Rediriger vers le dashboard après 2 secondes
      setTimeout(() => {
        navigate("/app", { replace: true });
      }, 2000);

    } catch (err) {
      console.error("Erreur mise à jour mot de passe:", err);
      setError("Erreur lors de la mise à jour. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher un loader pendant le chargement
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, ne rien afficher (redirection en cours)
  if (!user) {
    return null;
  }

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
          {/* SUCCÈS: MOT DE PASSE MIS À JOUR */}
          {/* ============================================= */}
          {success ? (
            <>
              <div className="text-center mb-10 animate-fade-up">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>

                <h1 className="font-serif text-display-md md:text-display-lg text-foreground mb-3">
                  <span className="text-gold-gradient">Mot de passe mis à jour</span>
                </h1>

                <p className="text-muted-foreground text-base leading-relaxed">
                  Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers votre tableau de bord.
                </p>
              </div>

              <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
                <Button
                  onClick={() => navigate("/app", { replace: true })}
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group"
                >
                  <span className="flex items-center gap-2">
                    Accéder au tableau de bord
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* ============================================= */}
              {/* FORMULAIRE DE CHANGEMENT DE MOT DE PASSE */}
              {/* ============================================= */}
              {/* Header */}
              <div className="text-center mb-10 animate-fade-up">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
                  <Shield className="w-8 h-8 text-primary" />
                </div>

                <h1 className="font-serif text-display-md md:text-display-lg text-foreground mb-3">
                  <span className="text-gold-gradient">Nouveau mot de passe</span>
                </h1>

                <p className="text-muted-foreground text-base leading-relaxed">
                  Créez un nouveau mot de passe sécurisé pour votre compte.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-5 animate-fade-up" style={{ animationDelay: "100ms" }}>
                {/* Nouveau mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm text-muted-foreground flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    Nouveau mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError(null);
                      }}
                      className="bg-card border-border/50 focus:border-primary/50 transition-colors h-12 pr-12"
                      disabled={isLoading}
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirmer mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm text-muted-foreground flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                      className="bg-card border-border/50 focus:border-primary/50 transition-colors h-12 pr-12"
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Critères de mot de passe */}
                <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                    Le mot de passe doit contenir :
                  </p>
                  <ul className="space-y-1">
                    <li className={`text-xs flex items-center gap-2 ${newPassword.length >= 8 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      Au moins 8 caractères
                    </li>
                    <li className={`text-xs flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      Une lettre majuscule
                    </li>
                    <li className={`text-xs flex items-center gap-2 ${/[a-z]/.test(newPassword) ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      Une lettre minuscule
                    </li>
                    <li className={`text-xs flex items-center gap-2 ${/[0-9]/.test(newPassword) ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      Un chiffre
                    </li>
                  </ul>
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
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mise à jour en cours...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Mettre à jour le mot de passe
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground/70 tracking-wide animate-fade-up" style={{ animationDelay: "200ms" }}>
            THE WHITE LIST — Sécurité de votre compte
          </p>
        </div>
      </div>
    </div>
  );
}

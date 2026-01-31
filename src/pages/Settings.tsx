import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, type UserProfile } from "@/lib/instantdb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Mail,
  Building2,
  CreditCard,
  CheckCircle2,
  XCircle,
  MailIcon,
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const { user } = db.useAuth();

  // Query user profile
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

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Update form when profile loads
  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || "");
      setLastName(userProfile.lastName || "");
      setEmail(userProfile.email || "");
      setHotelName(userProfile.hotelName || "");
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!userProfile) return;

    setIsSaving(true);
    try {
      await db.transact(
        db.tx.userProfiles[userProfile.id].update({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          hotelName: hotelName.trim(),
          // Email changes would require re-verification, so we don't update it here
        })
      );
      toast.success("Profil mis a jour avec succes");
    } catch (error) {
      console.error("[Settings] Error saving profile:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Profil non trouve</p>
      </div>
    );
  }

  const subscriptionStatus = userProfile?.subscriptionStatus || "unpaid";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 container max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-serif text-2xl text-foreground">Parametres</h1>
            <p className="text-sm text-muted-foreground">Gerez votre compte et abonnement</p>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-medium text-foreground mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Informations personnelles
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prenom</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Votre prenom"
                  className="w-full bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Votre nom"
                  className="w-full bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                value={email}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                L'email ne peut pas etre modifie
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotelName" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Nom de l'hotel
              </Label>
              <Input
                id="hotelName"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="Nom de votre etablissement"
                className="bg-background"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-12 bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Enregistrer les modifications
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <h2 className="text-lg font-medium text-foreground mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Abonnement
          </h2>

          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border/30">
              <div className="flex items-center gap-3">
                {subscriptionStatus === "active" ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-destructive" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {subscriptionStatus === "active"
                      ? "Abonnement actif"
                      : "Abonnement inactif"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    THE WHITE LIST Premium - 249,99 EUR/mois
                  </p>
                </div>
              </div>
            </div>

            {/* Cancel button */}
            {subscriptionStatus === "active" && (
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                className="w-full h-12 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                Resilier mon abonnement
              </Button>
            )}

            {/* Re-subscribe button for canceled users */}
            {subscriptionStatus === "canceled" && (
              <Button
                onClick={() => navigate("/app")}
                className="w-full h-12 bg-primary hover:bg-primary/90"
              >
                Renouveler mon abonnement
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Information Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-card border-border/50 max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MailIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <DialogTitle className="text-center font-serif text-xl">
              Resilier mon abonnement
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 rounded-lg bg-muted/50 border border-border/30 my-4 space-y-4">
            <p className="text-sm text-foreground">
              Si vous souhaitez resilier votre abonnement, veuillez envoyer un e-mail a l'adresse suivante :
            </p>
            <p className="text-center">
              <a
                href="mailto:thewhitelistparis@gmail.com"
                className="text-primary font-semibold hover:underline"
              >
                thewhitelistparis@gmail.com
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              Votre demande sera prise en compte et la resiliation sera effective dans un delai de 24 heures maximum.
            </p>
            <p className="text-sm text-muted-foreground">
              Les utilisateurs concernes pourront toutefois continuer a beneficier de leur essai gratuit jusqu'a son terme.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="w-full"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

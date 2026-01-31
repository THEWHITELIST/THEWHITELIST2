import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";
import {
  Crown,
  Check,
  Sparkles,
  Globe,
  Clock,
  Shield,
  LogOut,
  ArrowRight,
} from "lucide-react";

const STRIPE_LINK = "https://buy.stripe.com/cNi3cveZm9Jybjwg6m67S0q";

const FEATURES = [
  {
    icon: Globe,
    title: "Destinations illimitees",
    description: "Acces a plus de 50 destinations d'exception dans le monde",
  },
  {
    icon: Clock,
    title: "Itineraires personnalises",
    description: "Programmes sur mesure adaptes aux preferences de vos clients",
  },
  {
    icon: Sparkles,
    title: "Experiences exclusives",
    description: "Tables etoilees, visites privees, et experiences uniques",
  },
  {
    icon: Shield,
    title: "Support prioritaire",
    description: "Assistance dediee 7j/7 pour vos demandes urgentes",
  },
];

export default function Paywall() {
  const navigate = useNavigate();
  const { data: session } = useSession();

  const handleSubscribe = () => {
    // Open Stripe checkout in new tab
    window.open(STRIPE_LINK, "_blank");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">THE WHITE LIST</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Deconnexion
          </Button>
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            {/* Welcome message */}
            {session?.user && (
              <p className="text-center text-muted-foreground mb-2 animate-fade-in">
                Bienvenue, {session.user.name || session.user.email}
              </p>
            )}

            {/* Header */}
            <div className="text-center mb-12 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6">
                <Crown className="w-4 h-4 text-primary" />
                <span className="text-xs tracking-widest uppercase text-primary font-medium">
                  Abonnement Premium
                </span>
              </div>

              <h1 className="font-serif text-display-md md:text-display-lg text-foreground mb-4">
                Elevez votre
                <br />
                <span className="text-gold-gradient">service conciergerie</span>
              </h1>

              <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
                Accedez a l'ensemble de nos outils et ressources pour offrir
                une experience inegalee a vos clients les plus exigeants.
              </p>
            </div>

            {/* Pricing card */}
            <div className="relative animate-fade-up" style={{ animationDelay: "100ms" }}>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl" />

              <div className="relative bg-card border border-primary/20 rounded-2xl p-8 md:p-10">
                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl md:text-6xl font-serif text-gold-gradient">249,99</span>
                    <span className="text-xl text-muted-foreground">EUR/mois</span>
                  </div>
                  <p className="text-primary font-medium mt-2">
                    2 semaines d'essai offertes
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Sans engagement - Annulable a tout moment
                  </p>
                </div>

                {/* Features grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  {FEATURES.map((feature, index) => (
                    <div
                      key={feature.title}
                      className="flex gap-4 animate-fade-up"
                      style={{ animationDelay: `${150 + index * 50}ms` }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA button */}
                <Button
                  onClick={handleSubscribe}
                  className="w-full h-14 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Commencer maintenant
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>

                {/* Benefits list */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-primary" />
                    2 semaines d'essai offertes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-primary" />
                    Sans engagement
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-primary" />
                    Paiement securise
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-primary" />
                    Acces immediat
                  </span>
                </div>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 text-center animate-fade-up" style={{ animationDelay: "300ms" }}>
              <p className="text-xs text-muted-foreground/70 tracking-wide">
                Utilise par les plus grands etablissements hoteliers du monde
              </p>
              <div className="flex items-center justify-center gap-8 mt-4 opacity-50">
                <span className="font-serif text-lg">Ritz</span>
                <span className="font-serif text-lg">Bristol</span>
                <span className="font-serif text-lg">Plaza</span>
                <span className="font-serif text-lg">George V</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

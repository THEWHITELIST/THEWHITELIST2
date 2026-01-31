import { useNavigate } from "react-router-dom";
import {
  Clock,
  Star,
  Users,
  ChevronRight,
  Building2,
  Calendar,
  FileText,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  CheckCircle2,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

// THE WHITE LIST - Typographic Logo Component
function WhiteListLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span
        className="font-serif text-2xl md:text-3xl tracking-[0.35em] font-light text-foreground uppercase"
        style={{ letterSpacing: '0.35em' }}
      >
        THE WHITE LIST
      </span>
      <div className="w-16 h-[1px] bg-primary/60 mt-1" />
    </div>
  );
}

// Compact nav logo
function WhiteListLogoNav() {
  return (
    <div className="flex flex-col">
      <span
        className="font-serif text-lg tracking-[0.25em] font-light text-foreground uppercase"
        style={{ letterSpacing: '0.25em' }}
      >
        THE WHITE LIST
      </span>
      <div className="w-10 h-[1px] bg-primary/50 mt-0.5" />
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: "Le sur-mesure instantané",
      description: "Créez un programme complet en moins de 2 minutes. Chaque recommandation est issue de notre base vérifiée et actualisée."
    },
    {
      icon: Clock,
      title: "Plus de temps client",
      description: "Passez moins de temps derrière l'écran, plus de temps avec vos clients. L'accueil physique redevient votre priorité."
    },
    {
      icon: Star,
      title: "Standards 5 étoiles",
      description: "Uniquement des établissements de prestige : restaurants étoilés, spas d'exception, boutiques Avenue Montaigne."
    },
    {
      icon: Globe,
      title: "Export multilingue",
      description: "PDF élégant en 9 langues. Envoyez un programme personnalisé à votre clientèle internationale avant même son arrivée."
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      stat: "90%",
      label: "de temps gagné",
      detail: "sur la création de programmes"
    },
    {
      icon: Users,
      stat: "100%",
      label: "personnalisable",
      detail: "selon le profil client"
    },
    {
      icon: Shield,
      stat: "500+",
      label: "établissements vérifiés",
      detail: "à Paris et environs"
    }
  ];

  const testimonialQuote = "L'outil qui manquait à notre équipe de conciergerie. Nous créons désormais des programmes sur-mesure en quelques clics, avec une qualité que nos clients remarquent immédiatement.";

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <header className="relative z-50 animate-fade-in">
        <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <WhiteListLogoNav />

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              className="text-muted-foreground hover:text-foreground"
            >
              Se connecter
            </Button>
            <Button
              onClick={() => navigate("/signup")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Essai gratuit
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section - SEO H1 */}
      <section className="relative z-10 pt-12 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="mb-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-primary font-medium tracking-wide">L'hyper-personnalisation, sans effort.</span>
              </span>
            </div>

            {/* Main Headline - SEO optimized H1 */}
            <h1
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight mb-6 animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              Logiciel de conciergerie hôtelière :{" "}
              <span className="text-gold-gradient">le sur-mesure instantané</span>
            </h1>

            {/* Subheadline - Value proposition */}
            <p
              className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto animate-fade-in"
              style={{ animationDelay: "300ms" }}
            >
              Générez des programmes personnalisés en 2 minutes. Vos clients reçoivent un itinéraire d'exception{" "}
              <strong className="text-foreground">avant même leur arrivée</strong>.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
              style={{ animationDelay: "400ms" }}
            >
              <Button
                size="lg"
                onClick={() => navigate("/signup")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-8 text-base font-medium group shadow-lg shadow-primary/20"
              >
                Créer un compte gratuitement
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="border-primary/30 hover:bg-primary/5 h-14 px-8 text-base"
              >
                Demander une démonstration
              </Button>
            </div>

            {/* Trust signals */}
            <div
              className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in"
              style={{ animationDelay: "450ms" }}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Sans engagement
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Mise en place immédiate
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Support dédié
              </span>
            </div>
          </div>

          {/* Hero Visual - Program Preview */}
          <div
            className="mt-20 relative animate-fade-in"
            style={{ animationDelay: "500ms" }}
          >
            <div className="relative max-w-5xl mx-auto">
              {/* Decorative frame */}
              <div className="absolute -inset-4 border border-primary/10 rounded-2xl" />
              <div className="absolute -inset-8 border border-primary/5 rounded-3xl" />

              {/* Main preview card */}
              <div className="relative bg-card/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden shadow-2xl">
                {/* Header bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <span className="text-xs text-muted-foreground">Séjour Famille Martinez — 4 jours à Paris</span>
                  </div>
                </div>

                {/* Content preview */}
                <div className="p-8 grid md:grid-cols-3 gap-6">
                  {/* Day 1 preview */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Lundi 15 janvier</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-xs text-muted-foreground">10h00 — Culture</p>
                        <p className="text-sm font-medium">Musée d'Orsay</p>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-xs text-muted-foreground">12h30 — Déjeuner</p>
                        <p className="text-sm font-medium">Le Cinq ★★★</p>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-xs text-muted-foreground">15h00 — Visite</p>
                        <p className="text-sm font-medium">Galerie Dior</p>
                      </div>
                    </div>
                  </div>

                  {/* Day 2 preview */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Mardi 16 janvier</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-xs text-muted-foreground">10h00 — Bien-être</p>
                        <p className="text-sm font-medium">Spa Four Seasons</p>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-xs text-muted-foreground">13h00 — Gastronomie</p>
                        <p className="text-sm font-medium">L'Ambroisie ★★★</p>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-xs text-muted-foreground">16h00 — Shopping</p>
                        <p className="text-sm font-medium">Avenue Montaigne</p>
                      </div>
                    </div>
                  </div>

                  {/* Export preview */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Export PDF</span>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 h-[calc(100%-2rem)] flex flex-col items-center justify-center text-center">
                      <FileText className="w-12 h-12 text-primary/40 mb-3" />
                      <p className="text-sm font-medium">Document élégant</p>
                      <p className="text-xs text-muted-foreground mt-1">Français, anglais, chinois...</p>
                      <div className="mt-3 flex gap-1">
                        {["🇫🇷", "🇬🇧", "🇪🇸", "🇨🇳", "🇩🇪"].map((flag, i) => (
                          <span key={i} className="text-sm">{flag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits / ROI Section - H2 */}
      <section className="relative z-10 py-20 px-6 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary text-sm font-medium tracking-widest uppercase mb-4 block">
              Résultats immédiats
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
              L'efficacité au service de l'excellence
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Chaque minute économisée est une minute de plus consacrée à l'accueil personnalisé de vos clients.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.label}
                className="text-center p-8 rounded-2xl bg-card/50 border border-border animate-fade-in"
                style={{ animationDelay: `${600 + index * 100}ms` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <p className="text-4xl md:text-5xl font-serif font-bold text-primary mb-2">{benefit.stat}</p>
                <p className="text-lg font-medium text-foreground mb-1">{benefit.label}</p>
                <p className="text-sm text-muted-foreground">{benefit.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - H2 */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary text-sm font-medium tracking-widest uppercase mb-4 block">
              Fonctionnalités
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Tout ce dont votre conciergerie a besoin
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Un outil pensé par et pour les professionnels de l'hôtellerie de luxe.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl bg-card/50 border border-border hover:border-primary/30 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${700 + index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial / Social Proof Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Decorative quotes */}
            <div className="absolute -top-8 left-0 text-8xl text-primary/10 font-serif leading-none">"</div>
            <div className="absolute -bottom-8 right-0 text-8xl text-primary/10 font-serif leading-none rotate-180">"</div>

            <div className="p-12 rounded-2xl bg-gradient-to-br from-card via-card/80 to-card border border-primary/10 text-center">
              <Building2 className="w-10 h-10 text-primary mx-auto mb-6" />
              <p className="font-serif text-xl md:text-2xl text-foreground leading-relaxed mb-8 italic">
                {testimonialQuote}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                — Équipe conciergerie, Palace parisien
              </p>
              <div className="flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-primary fill-primary" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center p-12 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Prêt à transformer votre conciergerie ?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Rejoignez les établissements qui font confiance à notre solution pour sublimer l'expérience de leurs clients les plus exigeants.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/signup")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-10 text-base font-medium group shadow-lg shadow-primary/20"
              >
                Commencer gratuitement
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => navigate("/login")}
                className="h-14 px-8 text-base"
              >
                Demander une démo
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Configuration en moins de 5 minutes • Aucune carte bancaire requise
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <WhiteListLogoNav />
          <p className="text-sm text-muted-foreground">
            L'hyper-personnalisation, sans effort.
          </p>
        </div>
      </footer>
    </div>
  );
}

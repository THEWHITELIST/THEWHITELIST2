import { useState, useMemo } from "react";
import { Search, MapPin, ArrowRight, Clock, LogOut, Building2, History, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CITIES, City } from "@/lib/concierge-data";
import { useNavigate } from "react-router-dom";
import { db, type UserProfile } from "@/lib/instantdb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Welcome() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [comingSoonCity, setComingSoonCity] = useState<City | null>(null);
  const navigate = useNavigate();
  const { user } = db.useAuth();

  // Query user profile to get hotel name
  const { data: profileData } = db.useQuery(
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

  const handleSignOut = async () => {
    await db.auth.signOut();
  };

  // Paris is the only active city
  const ACTIVE_CITIES = ["paris"];

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return CITIES;
    const query = searchQuery.toLowerCase();
    return CITIES.filter(
      (city) =>
        city.name.toLowerCase().includes(query) ||
        city.country.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleCitySelect = (city: City) => {
    if (ACTIVE_CITIES.includes(city.id)) {
      setSelectedCity(city);
      setTimeout(() => {
        navigate(`/questionnaire/${city.id}`);
      }, 300);
    } else {
      setComingSoonCity(city);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 container max-w-4xl mx-auto px-6 py-12">
        {/* User bar */}
        {user && (
          <div className="flex items-center justify-between gap-3 mb-6 animate-fade-up">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/history")}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <History className="w-4 h-4 mr-1.5" />
                Historique
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/settings")}
                className="border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <Settings className="w-4 h-4 mr-1.5" />
                Mon Compte
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>{userProfile?.hotelName || user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Deconnexion
              </Button>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="text-center mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs tracking-widest uppercase text-primary font-medium">
              THE WHITE LIST
            </span>
          </div>

          <h1 className="font-serif text-display-lg md:text-display-xl text-foreground mb-4">
            Votre voyage
            <br />
            <span className="text-gold-gradient">d'exception</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Laissez-nous composer un itinéraire sur mesure, digne des plus grands
            palaces internationaux.
          </p>
        </header>

        {/* Search */}
        <div className="mb-12 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-base bg-card border-border/50 focus:border-primary/50 transition-colors rounded-xl luxury-input"
            />
          </div>
        </div>

        {/* City Grid */}
        <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <h2 className="text-sm tracking-widest uppercase text-muted-foreground mb-6 text-center">
            Destinations d'exception
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredCities.map((city, index) => {
              const isActive = ACTIVE_CITIES.includes(city.id);
              return (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city)}
                  style={{ animationDelay: `${200 + index * 50}ms` }}
                  className={`group relative overflow-hidden rounded-xl aspect-[2/1] luxury-card cursor-pointer text-left animate-fade-up transition-all duration-300 ${
                    selectedCity?.id === city.id ? "ring-2 ring-primary scale-[0.98]" : ""
                  }`}
                >
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <img
                      src={city.image}
                      alt={city.name}
                      className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                        !isActive ? "grayscale-[30%]" : ""
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                  </div>

                  {/* Coming Soon Badge */}
                  {!isActive && (
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/20">
                      <span className="text-xs tracking-wide text-white/90 font-medium">
                        A venir
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-end p-5">
                    <div className="flex items-center gap-1.5 text-primary/90 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-xs tracking-wide uppercase">
                        {city.country}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl text-white mb-1">
                      {city.name}
                    </h3>
                    <p className="text-white/70 text-sm italic">{city.tagline}</p>

                    {/* Arrow indicator */}
                    <div className={`absolute top-4 right-4 w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
                      isActive
                        ? "bg-white/10 opacity-0 group-hover:opacity-100"
                        : "bg-white/5 opacity-100"
                    }`}>
                      {isActive ? (
                        <ArrowRight className="w-4 h-4 text-white" />
                      ) : (
                        <Clock className="w-4 h-4 text-white/70" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredCities.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground">
                Aucune destination ne correspond à votre recherche.
              </p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <footer className="mt-16 text-center animate-fade-up" style={{ animationDelay: "400ms" }}>
          <p className="text-xs text-muted-foreground/70 tracking-wide">
            Chaque programme est conçu sur mesure par nos experts en voyage de luxe
          </p>
        </footer>
      </div>

      {/* Coming Soon Modal */}
      <Dialog open={!!comingSoonCity} onOpenChange={() => setComingSoonCity(null)}>
        <DialogContent className="bg-card border-border/50 max-w-md">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="font-serif text-2xl text-foreground">
              {comingSoonCity?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-base leading-relaxed">
              A venir - cette destination sera bientot disponible
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-sm text-muted-foreground text-center">
              Notre equipe compose actuellement les experiences d'exception pour {comingSoonCity?.name}.
              Revenez bientot pour decouvrir ce programme exclusif.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

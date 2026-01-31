import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db, type UserProfile } from "@/lib/instantdb";
import { Button } from "@/components/ui/button";
import SmartLogo from "@/components/SmartLogo";
import {
  Clock,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Mail,
  Shield,
  RefreshCw,
} from "lucide-react";

// V38: Configuration pour la page d'attente
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const POLL_INTERVAL_MS = 2000; // Polling toutes les 2s pendant l'attente
const INITIAL_TIMER_SECONDS = 120; // 2 minutes

export default function PendingApproval() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [timeRemaining, setTimeRemaining] = useState(INITIAL_TIMER_SECONDS);
  const [timerExpired, setTimerExpired] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { user } = db.useAuth();

  const { data: profileData } = db.useQuery(
    user
      ? {
          userProfiles: {
            $: { where: { odukiogaUserId: user.id } },
          },
        }
      : null
  );

  const userProfile = profileData?.userProfiles?.[0] as UserProfile | undefined;

  // Stop all intervals
  const stopAllIntervals = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // V38: Force verify via backend
  const forceVerifySession = useCallback(async () => {
    if (!sessionId) return null;

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/stripe/verify-session/${sessionId}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.data;
    } catch {
      return null;
    }
  }, [sessionId]);

  // Manual check button
  const handleManualCheck = async () => {
    setIsChecking(true);
    const result = await forceVerifySession();

    if (result?.status === "active" || result?.updated === true) {
      stopAllIntervals();
      setIsActivated(true);
      setTimeout(() => navigate("/app", { replace: true }), 1500);
    }
    setIsChecking(false);
  };

  // Detect activation via InstantDB real-time
  useEffect(() => {
    if (userProfile?.subscriptionStatus === "active" && !isActivated) {
      stopAllIntervals();
      setIsActivated(true);
      setTimeout(() => navigate("/app", { replace: true }), 1500);
    }
  }, [userProfile?.subscriptionStatus, isActivated, navigate, stopAllIntervals]);

  // Timer countdown
  useEffect(() => {
    if (isActivated || timerExpired) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActivated, timerExpired]);

  // Background polling
  useEffect(() => {
    if (isActivated || !sessionId) return;

    const poll = async () => {
      const result = await forceVerifySession();
      if (result?.status === "active" || result?.updated === true) {
        stopAllIntervals();
        setIsActivated(true);
        setTimeout(() => navigate("/app", { replace: true }), 1500);
      }
    };

    // Initial check
    poll();

    // Continue polling
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sessionId, isActivated, navigate, forceVerifySession, stopAllIntervals]);

  // Cleanup
  useEffect(() => () => stopAllIntervals(), [stopAllIntervals]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ========== ACTIVATED SUCCESS ==========
  if (isActivated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-md text-center animate-fade-up">
          <div className="mb-6 relative inline-block">
            <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full animate-pulse" />
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
          </div>

          <h1 className="font-serif text-2xl text-foreground mb-2">Abonnement active</h1>
          <p className="text-muted-foreground mb-6">Redirection en cours...</p>

          <Button
            onClick={() => navigate("/app", { replace: true })}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white group"
          >
            Acceder maintenant
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ========== TIMER EXPIRED - SEO MESSAGE ==========
  if (timerExpired) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
          <div className="absolute top-6 left-1/2 -translate-x-1/2">
            <SmartLogo />
          </div>

          <div className="w-full max-w-lg text-center">
            <div className="animate-fade-up">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/20 mb-8">
                <Shield className="w-10 h-10 text-primary" />
              </div>
            </div>

            <div className="mb-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
              <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
                Validation en cours
              </h1>

              <div className="bg-card border border-border/50 rounded-2xl p-6 text-left space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Votre paiement a bien ete enregistre par notre partenaire Stripe.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  La synchronisation avec votre compte peut prendre quelques instants supplementaires
                  en raison de nos protocoles de securite avances.
                </p>
                <div className="flex items-start gap-3 pt-2 border-t border-border/50">
                  <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    Si votre acces n'est pas active dans les 15 prochaines minutes,
                    contactez notre equipe a{" "}
                    <a
                      href="mailto:support@thewhitelist.fr"
                      className="text-primary hover:underline font-medium"
                    >
                      support@thewhitelist.fr
                    </a>
                    {" "}avec votre email de paiement.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
              <Button
                onClick={handleManualCheck}
                disabled={isChecking}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isChecking ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verification...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Verifier mon acces
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate("/login", { replace: true })}
                className="w-full h-12"
              >
                Retour a la connexion
              </Button>
            </div>

            <p className="mt-8 text-xs text-muted-foreground/70 animate-fade-up" style={{ animationDelay: "300ms" }}>
              Reference de session : {sessionId?.slice(0, 20)}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ========== TIMER RUNNING - WAITING SCREEN ==========
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
          <SmartLogo />
        </div>

        <div className="w-full max-w-md text-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
              <Clock className="w-10 h-10 text-emerald-500" />
            </div>
          </div>

          <div className="mb-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
              Activation en cours
            </h1>
            <p className="text-muted-foreground">
              Votre paiement est confirme. Synchronisation avec votre compte...
            </p>
          </div>

          {/* Timer Display */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 mb-8 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="text-5xl font-mono font-bold text-foreground mb-2">
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-muted-foreground">
              Temps d'attente estime
            </p>

            {/* Progress bar */}
            <div className="mt-4 w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                style={{
                  width: `${(timeRemaining / INITIAL_TIMER_SECONDS) * 100}%`,
                }}
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Verification automatique en cours...
            </div>
          </div>

          <Button
            onClick={handleManualCheck}
            disabled={isChecking}
            variant="outline"
            className="w-full h-12 animate-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            {isChecking ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verification...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Verifier maintenant
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

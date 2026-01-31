import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db, type UserProfile } from "@/lib/instantdb";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Crown,
  Loader2,
  ArrowRight,
  XCircle,
  RefreshCw,
} from "lucide-react";

// V38: Configuration optimisee pour sync ultra-rapide
const FORCE_CHECK_INTERVAL_MS = 1000; // Appel serveur toutes les 1s
const FORCE_CHECK_TIMEOUT_MS = 10000; // Timeout avant redirect vers pending-approval
const SUCCESS_REDIRECT_DELAY_MS = 800;

type PageState = "loading" | "success" | "canceled" | "error";

export default function PaymentReturn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [countdown, setCountdown] = useState(3);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const forceCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownStarted = useRef(false);
  const startTimeRef = useRef<number>(Date.now());

  const status = searchParams.get("status");
  const sessionId = searchParams.get("session_id");

  const { user, isLoading: authLoading } = db.useAuth();

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

  // Stopper le polling
  const stopForceCheck = useCallback(() => {
    if (forceCheckRef.current) {
      clearInterval(forceCheckRef.current);
      forceCheckRef.current = null;
    }
  }, []);

  // V38: FORCE CHECK - Appel serveur pour forcer la sync
  const forceVerifySession = useCallback(async () => {
    if (!sessionId) return null;

    try {
      const response = await fetch(
        `/api/stripe/verify-session?sessionId=${sessionId}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.data;
    } catch {
      return null;
    }
  }, [sessionId]);

  // Cas Annulation : Affichage immédiat
  useEffect(() => {
    if (status === "canceled") {
      setPageState("canceled");
    }
  }, [status]);

  // Détection temps réel InstantDB
  useEffect(() => {
    if (pageState === "loading" && userProfile?.subscriptionStatus === "active") {
      stopForceCheck();
      setPageState("success");
    }
  }, [userProfile?.subscriptionStatus, pageState, stopForceCheck]);

  // V38: Logique principale - Force Check "Marteau-Piqueur"
  useEffect(() => {
    if (status === "canceled") return;
    if (pageState !== "loading") return;
    if (!sessionId) return;
    if (forceCheckRef.current) return;

    // Déjà actif?
    if (userProfile?.subscriptionStatus === "active") {
      setPageState("success");
      return;
    }

    // Lancer le polling agressif
    startTimeRef.current = Date.now();

    const runCheck = async () => {
      const elapsed = Date.now() - startTimeRef.current;

      // Timeout -> Redirect vers pending-approval
      if (elapsed >= FORCE_CHECK_TIMEOUT_MS) {
        stopForceCheck();
        navigate(`/pending-approval?session_id=${sessionId}`, { replace: true });
        return;
      }

      // Force check serveur
      const result = await forceVerifySession();

      if (result?.status === "active" || result?.updated === true) {
        stopForceCheck();
        setPageState("success");
      }
    };

    // Premier appel immédiat
    runCheck();

    // Puis toutes les secondes
    forceCheckRef.current = setInterval(runCheck, FORCE_CHECK_INTERVAL_MS);
  }, [sessionId, status, pageState, userProfile?.subscriptionStatus, navigate, forceVerifySession, stopForceCheck]);

  // Nettoyage
  useEffect(() => () => stopForceCheck(), [stopForceCheck]);

  // Countdown + Redirection auto sur succès
  useEffect(() => {
    if (pageState === "success" && !countdownStarted.current) {
      countdownStarted.current = true;

      const startTimer = setTimeout(() => {
        const timerInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timerInterval);
              navigate("/app", { replace: true });
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, SUCCESS_REDIRECT_DELAY_MS);

      return () => clearTimeout(startTimer);
    }
  }, [pageState, navigate]);

  // ========== RENDER ==========

  // LOADER
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-950/20 to-background flex items-center justify-center">
        <div className="text-center max-w-md px-6 animate-fade-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
          </div>
          <h2 className="text-xl font-medium text-foreground mb-2">Finalisation</h2>
          <p className="text-muted-foreground">Synchronisation de votre abonnement...</p>
        </div>
      </div>
    );
  }

  // CANCELED
  if (pageState === "canceled") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md text-center animate-fade-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 border border-destructive/20 mb-6">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-serif text-foreground mb-2">Paiement annule</h1>
          <p className="text-muted-foreground mb-8">
            La transaction n'a pas abouti. Vous n'avez pas ete debite.
          </p>
          <Button
            onClick={() => navigate("/login", { replace: true })}
            className="w-full h-12 bg-primary hover:bg-primary/90"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reessayer
          </Button>
        </div>
      </div>
    );
  }

  // ERROR
  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">Une erreur est survenue</h2>
          <p className="text-muted-foreground mb-6">{errorMessage || "Impossible de verifier le statut."}</p>
          <Button onClick={() => navigate("/login")} variant="outline">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  // SUCCESS
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center animate-fade-up">
        <div className="mb-8 relative inline-block">
          <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full animate-pulse" />
          <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <Crown className="w-3 h-3 text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Abonnement Confirme
          </span>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">Bienvenue au Club</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Votre acces est maintenant actif.
          <br />
          Redirection vers votre espace...
        </p>

        <Button
          onClick={() => navigate("/app", { replace: true })}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white mb-6 group"
        >
          Acceder maintenant
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>

        <div className="flex flex-col items-center gap-2">
          <div className="w-full h-1 bg-emerald-900/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all ease-linear duration-1000"
              style={{ width: `${(countdown / 3) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground font-medium">Entree dans {countdown}s</p>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { db } from "@/lib/instantdb";

interface SmartLogoProps {
  className?: string;
}

/**
 * SmartLogo - A clickable "THE WHITE LIST" logo that navigates based on auth state
 * - If user is logged in: navigates to /app (Dashboard)
 * - If user is NOT logged in: navigates to / (Landing Page)
 */
export default function SmartLogo({ className = "" }: SmartLogoProps) {
  const navigate = useNavigate();
  const { user } = db.useAuth();

  const handleClick = () => {
    if (user !== null) {
      // User is logged in - go to Dashboard
      navigate("/app");
    } else {
      // User is not logged in - go to Landing Page
      navigate("/");
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex flex-col cursor-pointer ${className}`}
    >
      <span
        className="font-serif text-lg tracking-[0.25em] font-light text-foreground uppercase"
        style={{ letterSpacing: "0.25em" }}
      >
        THE WHITE LIST
      </span>
      <div className="w-10 h-[1px] bg-primary/50 mt-0.5" />
    </div>
  );
}

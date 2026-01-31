import type { Program, ViewMode } from "./types";

interface ProgramIntroProps {
  program: Program;
  viewMode: ViewMode;
}

export function ProgramIntro({ program, viewMode }: ProgramIntroProps) {
  return (
    <section className="p-5 rounded-xl bg-[#12121a] border border-amber-500/10">
      {viewMode === "concierge" ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-xs font-medium uppercase tracking-wide">
              Note interne
            </span>
          </div>
          <p className="text-gray-300 leading-relaxed">
            {program.introInternal ||
              "Programme genere automatiquement. Verifier les disponibilites de chaque etablissement."}
          </p>
        </>
      ) : (
        <p className="font-serif text-lg text-gray-200 italic leading-relaxed">
          "{program.introClient ||
            "Nous avons le plaisir de vous presenter votre programme personnalise."}"
        </p>
      )}
    </section>
  );
}

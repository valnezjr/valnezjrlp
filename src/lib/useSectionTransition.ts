import { useEffect, useState } from "react";
import type { SectionId } from "./navigation";

// CSS puro (sem framer-motion): a transição é só um fade sequencial com
// um leve deslocamento no fade-in — não precisa de orquestração de
// gestos, layout compartilhado ou spring physics que justificasse trazer
// uma lib nova. Duração total ~500ms (200 saindo + 300 entrando),
// architecture.md §5.
const LEAVE_MS = 200;
const ENTER_MS = 300;

type Phase = "idle" | "leaving" | "entering";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * Troca a seção exibida com fade-out → fade-in sequencial (a seção nova
 * só monta depois que a atual sumiu). `isTransitioning` serve pra
 * bloquear novos cliques de navegação enquanto a animação roda
 * (architecture.md §5). Com `prefers-reduced-motion`, troca instantânea.
 */
export function useSectionTransition(active: SectionId) {
  const [displayed, setDisplayed] = useState(active);
  const [phase, setPhase] = useState<Phase>("idle");
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (active === displayed) return;

    if (reducedMotion) {
      setDisplayed(active);
      return;
    }

    setPhase("leaving");
    const leaveTimer = setTimeout(() => {
      setDisplayed(active);
      setPhase("entering");
    }, LEAVE_MS);

    return () => clearTimeout(leaveTimer);
  }, [active, displayed, reducedMotion]);

  useEffect(() => {
    if (phase !== "entering") return;
    const enterTimer = setTimeout(() => setPhase("idle"), ENTER_MS);
    return () => clearTimeout(enterTimer);
  }, [phase]);

  return { displayed, isTransitioning: phase !== "idle", phase };
}

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { LivingBackground, Splash, ThemeProvider } from "mothership-ds";
import { Navbar } from "@/components/Navbar";
import { SectionDots } from "@/components/SectionDots";
import { SECTIONS, type SectionId } from "@/lib/navigation";
import { useSectionTransition } from "@/lib/useSectionTransition";
import { useWheelSectionNav } from "@/lib/useWheelSectionNav";
import { cn } from "@/lib/utils";
import { Home } from "@/sections/Home";
import { Servicos } from "@/sections/Servicos";
import { Sobre } from "@/sections/Sobre";
import { Contato } from "@/sections/Contato";

// Navegação por estado, sem react-router — decisão registrada em
// docs/architecture.md §3 (página única, sem SSR, sem URLs a
// preservar).
const SECTION_COMPONENTS: Record<SectionId, ComponentType<{ onNavigate: (section: SectionId) => void }>> = {
  home: Home,
  servicos: Servicos,
  sobre: Sobre,
  contato: Contato,
};

const FOCUSABLE_INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function App() {
  // Splash de tela cheia antes da página — some sozinha depois do load
  // (mínimo de tempo em tela padrão do componente, 1800ms). O resto do
  // app já monta por baixo (mesmo padrão do próprio exemplo Next.js do
  // mothership-ds); o z-index:1000 do Splash cobre tudo até sumir.
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<SectionId>("home");
  const { displayed, isTransitioning, phase } = useSectionTransition(active);
  const ActiveSection = SECTION_COMPONENTS[displayed];
  const mainRef = useRef<HTMLElement>(null);

  function navigate(section: SectionId) {
    if (isTransitioning) return;
    setActive(section);
  }

  // Passo relativo (-1/+1) na ordem canônica das seções, com wrap —
  // mesma semântica pras setas do teclado e pro scroll do mouse
  // (useWheelSectionNav), pra não duplicar a conta de índice em dois
  // lugares. useCallback só pra manter identidade estável entre
  // renders — useWheelSectionNav guarda a versão mais recente numa ref
  // e não resubscreve o listener a cada troca de seção.
  const navigateRelative = useCallback(
    (direction: -1 | 1) => {
      if (isTransitioning) return;
      const currentIndex = SECTIONS.findIndex((s) => s.id === active);
      const nextIndex = (currentIndex + direction + SECTIONS.length) % SECTIONS.length;
      setActive(SECTIONS[nextIndex].id);
    },
    [active, isTransitioning],
  );

  // Setas esquerda/direita navegam entre seções, na ordem da navbar
  // (architecture.md §5) — exceto com foco num campo de formulário,
  // onde a seta precisa mover o cursor de texto, não trocar de seção.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

      const target = document.activeElement;
      if (
        target instanceof HTMLElement &&
        (FOCUSABLE_INPUT_TAGS.has(target.tagName) || target.isContentEditable)
      ) {
        return;
      }

      navigateRelative(e.key === "ArrowRight" ? 1 : -1);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navigateRelative]);

  // Scroll do mouse/trackpad troca de seção, um passo por gesto —
  // roteiro § Extras. Ver useWheelSectionNav pro porquê do cooldown e
  // do respeito às áreas com scroll interno de verdade (galeria do
  // portfólio, decisão #32).
  useWheelSectionNav(mainRef, navigateRelative);

  return (
    <ThemeProvider>
      {loading && <Splash onFinish={() => setLoading(false)} />}
      <LivingBackground />
      <div className="flex h-full w-full flex-col overflow-hidden">
        <Navbar active={active} onNavigate={navigate} />
        <main
          ref={mainRef}
          className={cn(
            "flex-1 overflow-hidden",
            phase === "leaving" && "section-leaving",
            phase === "entering" && "section-entering",
          )}
        >
          <ActiveSection onNavigate={navigate} />
        </main>
        <SectionDots active={active} onNavigate={navigate} />
      </div>
    </ThemeProvider>
  );
}

export default App;

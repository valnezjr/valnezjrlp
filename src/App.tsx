import { useEffect, useState, type ComponentType } from "react";
import { ThemeProvider } from "mothership-ds";
import { Navbar } from "@/components/Navbar";
import { SECTIONS, type SectionId } from "@/lib/navigation";
import { useSectionTransition } from "@/lib/useSectionTransition";
import { cn } from "@/lib/utils";
import { Home } from "@/sections/Home";
import { Servicos } from "@/sections/Servicos";
import { Sobre } from "@/sections/Sobre";
import { Contato } from "@/sections/Contato";

// Navegação por estado, sem react-router — decisão registrada em
// docs/architecture.md §3 (página única, sem SSR, sem URLs a
// preservar).
const SECTION_COMPONENTS: Record<SectionId, ComponentType> = {
  home: Home,
  servicos: Servicos,
  sobre: Sobre,
  contato: Contato,
};

const FOCUSABLE_INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function App() {
  const [active, setActive] = useState<SectionId>("home");
  const { displayed, isTransitioning, phase } = useSectionTransition(active);
  const ActiveSection = SECTION_COMPONENTS[displayed];

  function navigate(section: SectionId) {
    if (isTransitioning) return;
    setActive(section);
  }

  // Setas esquerda/direita navegam entre seções, na ordem da navbar
  // (architecture.md §5) — exceto com foco num campo de formulário,
  // onde a seta precisa mover o cursor de texto, não trocar de seção.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (isTransitioning) return;

      const target = document.activeElement;
      if (
        target instanceof HTMLElement &&
        (FOCUSABLE_INPUT_TAGS.has(target.tagName) || target.isContentEditable)
      ) {
        return;
      }

      const currentIndex = SECTIONS.findIndex((s) => s.id === active);
      const direction = e.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (currentIndex + direction + SECTIONS.length) % SECTIONS.length;
      setActive(SECTIONS[nextIndex].id);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, isTransitioning]);

  return (
    <ThemeProvider>
      <div className="flex h-full w-full flex-col overflow-hidden">
        <Navbar active={active} onNavigate={navigate} />
        <main
          className={cn(
            "flex-1 overflow-hidden",
            phase === "leaving" && "section-leaving",
            phase === "entering" && "section-entering",
          )}
        >
          <ActiveSection />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;

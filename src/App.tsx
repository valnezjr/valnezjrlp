import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { LivingBackground, Splash, ThemeProvider, TooltipProvider } from "mothership-ds";
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

      // a11y-002 (.audit/): as setas não podem trocar de seção por trás
      // de um Modal aberto — o Modal do mothership-ds prende o foco
      // dentro de si (inclusive em botões, que passam pelo guard acima
      // sem barrar), mas este listener vive em `document`, então sem
      // este check a troca acontecia por baixo do véu. `role="dialog"`
      // só existe no DOM enquanto o Modal está montado/visível
      // (Modal.tsx: `if (!mounted || !visible) return null`) — a
      // checagem já cobre a animação de fechamento também.
      // `useWheelSectionNav` já era imune a isso por outro motivo
      // (escopado a `main`, que o Modal nunca atinge por portar pro
      // `body`) — mesma proteção, caminho diferente.
      if (document.querySelector('[role="dialog"]')) return;

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

  // a11y-001 (.audit/): nenhum dos 4 caminhos de navegação (Navbar,
  // SectionDots, teclado, wheel) movia o foco ou avisava leitor de tela
  // ao trocar de seção — a pessoa clicava e não tinha nenhum sinal de
  // que algo mudou. Centralizado aqui (achando o <h1> dentro de `main`)
  // em vez de tabIndex por seção porque o <h1> de Home vem de dentro do
  // Hero do mothership-ds, que não expõe ref/id pro elemento interno —
  // "achar o primeiro h1 depois que o DOM da seção nova montou" cobre
  // as 4 seções sem precisar tocar na lib. `tabIndex=-1` só é setado se
  // ainda não existir, pra não sobrescrever um valor explícito que
  // algum h1 venha a ter no futuro. Não roda na primeira montagem —
  // foco de carga de página é papel do navegador, não deste efeito; só
  // troca de seção via navegação real deve mover foco. Compara com o
  // `displayed` anterior (em vez de um booleano "primeira vez") de
  // propósito: `<StrictMode>` (main.tsx) roda todo efeito 2x em dev
  // sem cleanup pra revelar bugs desse tipo — um booleano simples
  // marca "já rodei" na 1ª chamada e foca errado na 2ª simulada;
  // comparar o valor em si é imune, porque `displayed` não muda entre
  // as duas chamadas sintéticas.
  const prevDisplayedRef = useRef<SectionId | null>(null);
  useEffect(() => {
    const prev = prevDisplayedRef.current;
    prevDisplayedRef.current = displayed;
    if (prev === null || prev === displayed) return;
    const heading = mainRef.current?.querySelector<HTMLElement>("h1");
    if (!heading) return;
    if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }, [displayed]);

  return (
    <ThemeProvider>
      {loading && <Splash onFinish={() => setLoading(false)} />}
      {/* a11y-004 (.audit/): dá tooltip a qualquer elemento com data-tip
          — reage a ponteiro e a foco de teclado desde o commit pinado
          em package.json (docs/architecture.md § Registro de decisões
          #47). Só monta o mecanismo; cada uso decide se o elemento é
          focável (tabIndex) — ver SkillsMarquees.tsx. */}
      <TooltipProvider>
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
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;

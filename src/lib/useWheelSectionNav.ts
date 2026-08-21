import { useEffect, useRef, type RefObject } from "react";

// Extra do roteiro (§ Extras): "Adicione troca de seção via scroll do
// mouse (com debounce para trocar apenas uma seção por gesto), mantendo
// o fade." — arquitetura.md §4 já garante que a página em si nunca rola
// (overflow:hidden em html/body/#root); o wheel aqui não está brigando
// com um scroll nativo da página, só decidindo quando um gesto de roda
// deve trocar de seção.
//
// Duas armadilhas que a implementação precisa evitar:
//
// 1. Trackpads emitem dezenas de eventos `wheel` de deltaY pequeno por
//    um único gesto físico — sem um cooldown por gesto (não só o
//    `isTransitioning` da própria transição, que demora ~500ms pra virar
//    true de verdade), um "swoosh" continua trocando várias seções em
//    sequência. `WHEEL_COOLDOWN_MS` (bloqueio via ref, não state — não
//    pode esperar um re-render) cobre a duração da transição com folga.
// 2. Existem áreas com scroll interno de verdade dentro de uma seção
//    (`.portfolio-gallery .ms-gallery__grid`, decisão #32 do
//    architecture.md — grade do portfólio que rola sozinha nas alturas
//    mais baixas). Rolar essa grade não pode trocar de seção enquanto
//    ainda houver conteúdo pra rolar ali dentro; só quando ela já está
//    no limite (topo/fundo) o wheel passa a trocar de seção. `Modal`/
//    `Drawer` portam pra `document.body` (fora de `#root`, index.css) —
//    o listener é escopado ao container de conteúdo (`main`), então
//    wheel dentro de um Modal aberto nunca chega aqui.
const WHEEL_THRESHOLD = 12;
const WHEEL_COOLDOWN_MS = 650;

function findScrollableAncestor(start: Element | null, boundary: Element): HTMLElement | null {
  let node: Element | null = start;
  while (node && node !== boundary) {
    if (node instanceof HTMLElement) {
      const overflowY = getComputedStyle(node).overflowY;
      const scrollable = overflowY === "auto" || overflowY === "scroll";
      if (scrollable && node.scrollHeight > node.clientHeight + 1) {
        return node;
      }
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Troca de seção via roda do mouse/trackpad, um passo por gesto.
 * `onNavigateRelative` recebe -1 (seção anterior) ou 1 (próxima),
 * mesma semântica (com wrap) da navegação por setas em App.tsx.
 */
export function useWheelSectionNav(
  containerRef: RefObject<HTMLElement | null>,
  onNavigateRelative: (direction: -1 | 1) => void,
) {
  const cooldownRef = useRef(false);
  const onNavigateRef = useRef(onNavigateRelative);
  onNavigateRef.current = onNavigateRelative;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
      if (cooldownRef.current) return;

      const scrollable = findScrollableAncestor(e.target as Element, container!);
      if (scrollable) {
        const scrollingDown = e.deltaY > 0;
        const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;
        const atTop = scrollable.scrollTop <= 0;
        if ((scrollingDown && !atBottom) || (!scrollingDown && !atTop)) {
          return; // ainda há o que rolar ali dentro — não troca de seção
        }
      }

      e.preventDefault();
      cooldownRef.current = true;
      onNavigateRef.current(e.deltaY > 0 ? 1 : -1);
      window.setTimeout(() => {
        cooldownRef.current = false;
      }, WHEEL_COOLDOWN_MS);
    }

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [containerRef]);
}

/**
 * Breakpoints da grade paginada do portfólio — fonte única pro lado JS
 * (useItemsPerPage, Sobre.tsx) e referência cruzada pro lado CSS
 * (`.portfolio-gallery`, index.css). Achado real da auditoria
 * (arquitetura-001, .audit/): os dois lados repetiam os mesmos
 * limiares (640/700) e contagens (1/3/5) como literais soltos, sem
 * nada de errado de build/tipo se um lado ficasse pra trás — e já
 * ficou, mais de uma vez (docs/architecture.md decisões #20 e #22).
 *
 * CSS não lê constante de TypeScript — mudar um valor aqui só resolve
 * o cálculo de paginação (quantos itens por página o StepIndicator
 * mostra). O número de colunas visíveis de verdade
 * (`grid-template-columns`, index.css § .portfolio-gallery) precisa
 * ser atualizado à mão junto, sempre nos MESMOS dois valores — por
 * isso o comentário lá aponta pra cá, e este arquivo documenta os
 * três pontos que dependem dele.
 */
export const GALLERY_WIDE_MIN_WIDTH = 640; // px — index.css § .portfolio-gallery, primeiro @media
export const GALLERY_SHORT_MAX_HEIGHT = 700; // px — index.css § .portfolio-gallery, segundo @media

export const GALLERY_COLUMNS = {
  /** < GALLERY_WIDE_MIN_WIDTH — card padrão da lib (foto 4:3 em cima) não cabe 2 empilhados. */
  narrow: 1,
  /** >= GALLERY_WIDE_MIN_WIDTH, altura normal — index.css `repeat(3, 1fr)`. */
  wide: 3,
  /** >= GALLERY_WIDE_MIN_WIDTH e <= GALLERY_SHORT_MAX_HEIGHT — index.css `repeat(5, 1fr)`. */
  wideShort: 5,
} as const;

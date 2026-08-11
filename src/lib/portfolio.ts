// Helpers compartilhados entre Sobre.tsx (monta os itens da Gallery) e
// CaseViewer.tsx (monta o link de download dentro do case aberto no
// Modal) — extraído de Sobre.tsx pra não duplicar a lógica de
// BASE_URL/mobile em dois lugares quando o case HTML passou a viver num
// componente próprio.

// import.meta.env.BASE_URL: "/" no dev, "/valnezjrlp/" em produção
// (vite.config.ts — GitHub Pages de projeto serve sob subpasta). Sem
// isso os PDFs/imagens/cases quebrariam só no ar, nunca localmente.
export const BASE = import.meta.env.BASE_URL;

// `<640px` é o mesmo corte que o resto do arquivo já usa pra "estreito"
// (Sobre.tsx § useItemsPerPage) — sem hook/estado próprio porque só
// importa no instante em que o Modal abre, não precisa reagir a resize
// com o Modal já aberto.
function isNarrowViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;
}

// public/portfolio-mobile/*.pdf — versão de cada case reformatada em
// coluna única (retrato, 9 páginas em vez de 6) pra leitura confortável
// em tela de celular, sem precisar dar zoom/scroll horizontal no PDF
// desktop. Mesmo `file` dos projetos, só com sufixo "-mobile".
export function pdfUrlFor(file: string): string {
  return isNarrowViewport() ? `${BASE}portfolio-mobile/${file}-mobile.pdf` : `${BASE}portfolio/${file}.pdf`;
}

// public/portfolio-case/{file}.html — apresentação do case (não mais o
// PDF renderizado em canvas, ver docs/architecture.md § Registro de
// decisões #33). Não varia por viewport: é HTML responsivo por natureza,
// diferente do PDF que precisa de uma versão paginada própria pro
// celular.
export function caseUrlFor(file: string): string {
  return `${BASE}portfolio-case/${file}.html`;
}

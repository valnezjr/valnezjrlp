export type SectionId = "home" | "servicos" | "sobre" | "contato";

/** Ordem canônica das seções (architecture.md §3) — usada pela navbar
 * e, na Etapa 3, pela navegação por teclado (setas). */
export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "servicos", label: "Serviços" },
  { id: "sobre", label: "Sobre" },
  { id: "contato", label: "Contato" },
];

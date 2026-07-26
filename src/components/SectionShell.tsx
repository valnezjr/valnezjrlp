import type { ReactNode } from "react";

/**
 * Wrapper comum de toda seção: já aplica o padding-top que compensa a
 * navbar flutuante fixa, então nenhuma seção calcula isso sozinha
 * (architecture.md §2, §4). Ocupa 100% da área de conteúdo, sem gerar
 * scroll — se o conteúdo não couber, quem se adapta é a seção, nunca
 * este wrapper.
 */
export function SectionShell({ children }: { children: ReactNode }) {
  return (
    <section className="flex h-full w-full flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-6 sm:pt-28">
      {children}
    </section>
  );
}

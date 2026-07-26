import { SECTIONS, type SectionId } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Navbar flutuante fixa — funciona como header e menu de navegação
 * (CLAUDE.md). Menu mobile em Sheet fica para a Etapa 8 do roteiro.
 */
export function Navbar({
  active,
  onNavigate,
}: {
  active: SectionId;
  onNavigate: (section: SectionId) => void;
}) {
  return (
    <nav
      aria-label="Navegação principal"
      className="bg-background/70 supports-[backdrop-filter]:bg-background/60 fixed inset-x-4 top-4 z-50 flex items-center justify-between rounded-full border px-5 py-2.5 shadow-lg backdrop-blur sm:inset-x-8 sm:top-6 sm:px-6 sm:py-3"
    >
      <span className="text-base font-semibold sm:text-lg">valnezjr</span>
      <ul className="flex items-center gap-0.5 sm:gap-1">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              aria-current={active === section.id ? "page" : undefined}
              onClick={() => onNavigate(section.id)}
              className={cn(
                "rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                active === section.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

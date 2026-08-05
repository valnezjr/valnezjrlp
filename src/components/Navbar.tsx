import { SECTIONS, type SectionId } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Navbar flutuante fixa — funciona como header e menu de navegação
 * (CLAUDE.md). Reaproveita as classes visuais do Navbar do mothership-ds
 * (.ms-navbar/.ms-navbar__brand/.ms-navbar__link) em vez do componente
 * <Navbar> da lib: aquele espera links reais (href) com scroll-spy, e
 * aqui a navegação é por estado (architecture.md §3), sem URLs.
 * Menu mobile fica para a Etapa 8 do roteiro.
 */
export function Navbar({
  active,
  onNavigate,
}: {
  active: SectionId;
  onNavigate: (section: SectionId) => void;
}) {
  return (
    <nav aria-label="Navegação principal" className="ms-navbar">
      <span className="ms-navbar__brand">valnezjr</span>
      {SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          aria-current={active === section.id ? "page" : undefined}
          onClick={() => onNavigate(section.id)}
          className={cn(
            "ms-navbar__link",
            active === section.id && "ms-navbar__link--active",
          )}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}

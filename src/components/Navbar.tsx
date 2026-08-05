import { useId, useState } from "react";
import { Drawer } from "mothership-ds";
import { SECTIONS, type SectionId } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Navbar flutuante fixa — funciona como header e menu de navegação
 * (CLAUDE.md). Reaproveita as classes visuais do Navbar do mothership-ds
 * (.ms-navbar/.ms-navbar__brand/.ms-navbar__link) em vez do componente
 * <Navbar> da lib: aquele espera links reais (href) com scroll-spy, e
 * aqui a navegação é por estado (architecture.md §3), sem URLs.
 *
 * Menu mobile (Etapa 8): abaixo de 720px, `.ms-navbar:has(.ms-navbar__burger)`
 * já esconde os `.ms-navbar__link` diretos e mostra o `.ms-navbar__burger`
 * sozinho (CSS da própria lib, nenhuma regra extra precisou ser escrita
 * aqui). O painel é um `Drawer` — mesmo mecanismo que a `Sidebar` usa pra
 * própria gaveta mobile (architecture.md § Registro de decisões #9),
 * side="right" (não o padrão "left" da Sidebar) por ficar do mesmo lado
 * do botão hamburguer, que aqui sempre cai à direita.
 */
export function Navbar({
  active,
  onNavigate,
}: {
  active: SectionId;
  onNavigate: (section: SectionId) => void;
}) {
  const [open, setOpen] = useState(false);
  const drawerId = `${useId().replace(/[^a-zA-Z0-9_-]/g, "")}-drawer`;

  function navigate(section: SectionId) {
    onNavigate(section);
    setOpen(false);
  }

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className={cn("ms-navbar", open && "ms-navbar--open")}
      >
        <span className="ms-navbar__brand">valnezjr</span>
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            aria-current={active === section.id ? "page" : undefined}
            onClick={() => navigate(section.id)}
            className={cn(
              "ms-navbar__link",
              active === section.id && "ms-navbar__link--active",
            )}
          >
            {section.label}
          </button>
        ))}
        <button
          type="button"
          className="ms-navbar__burger"
          aria-label="Menu"
          aria-expanded={open}
          aria-controls={drawerId}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <Drawer open={open} onClose={() => setOpen(false)} side="right">
        <nav
          id={drawerId}
          aria-label="Navegação principal"
          className="flex flex-col gap-2"
        >
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              aria-current={active === section.id ? "page" : undefined}
              onClick={() => navigate(section.id)}
              className={cn(
                "ms-navbar__link w-full justify-start",
                active === section.id && "ms-navbar__link--active",
              )}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </Drawer>
    </>
  );
}

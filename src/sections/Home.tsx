import { Button, Hero, HeroHighlight, Splash } from "mothership-ds";
import { SectionShell } from "@/components/SectionShell";
import type { SectionId } from "@/lib/navigation";

// docs/prd.md §5.1. CTAs usam Button (onClick), não ButtonLink (href) —
// mesma razão da Navbar: navegação por estado, não por URL real
// (architecture.md §3, decisão #5).
//
// Visual de apoio (campo deixado em aberto no PRD): o loop de animação
// da logo — Splash com inline+persistent, que monta o LogoMark e some
// sozinho (fica "pronto", com o degradê da marca correndo indefinidamente
// via <animateTransform> do próprio SVG, ver mothership-ds/LogoMark.tsx).
// LogoMark não tem uso isolado fora do Splash por design — as partes
// nascem fora de posição, esperando essa montagem (mothership-ds
// styleguide, story "Splash"). Só a partir de lg (1024px): abaixo disso
// a dupla coluna não cabe sem apertar o texto ou criar scroll.
export function Home({ onNavigate }: { onNavigate: (section: SectionId) => void }) {
  return (
    <SectionShell>
      <div className="flex w-full max-w-5xl flex-col items-center gap-8 lg:flex-row lg:justify-between">
        <div className="flex-1">
          <Hero
            title={
              <>
                Do componente ao sistema, da marca ao <HeroHighlight>produto</HeroHighlight>.
              </>
            }
            subtitle="Valnez Júnior, Designer Engineer — projetos completos, acessíveis e com identidade, para negócios locais e empresas de tecnologia."
            actions={
              <>
                <Button inline variant="solid" onClick={() => onNavigate("contato")}>
                  Fale comigo
                </Button>
                <Button inline variant="ghost" onClick={() => onNavigate("servicos")}>
                  Ver serviços
                </Button>
              </>
            }
          />
        </div>
        <div
          className="relative hidden h-64 w-64 shrink-0 overflow-hidden lg:block"
          style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}
        >
          <Splash inline persistent ready />
        </div>
      </div>
    </SectionShell>
  );
}

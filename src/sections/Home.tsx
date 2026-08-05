import { Button, Hero, HeroHighlight } from "mothership-ds";
import { SectionShell } from "@/components/SectionShell";
import type { SectionId } from "@/lib/navigation";

// docs/prd.md §5.1. CTAs usam Button (onClick), não ButtonLink (href) —
// mesma razão da Navbar: navegação por estado, não por URL real
// (architecture.md §3, decisão #5).
export function Home({ onNavigate }: { onNavigate: (section: SectionId) => void }) {
  return (
    <SectionShell>
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
    </SectionShell>
  );
}

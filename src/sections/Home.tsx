import { useEffect } from "react";
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
//
// style={{ background: "none" }} no Splash: .ms-splash sempre pinta o
// próprio --bg-base/--bg-page por baixo (faz sentido em tela cheia,
// onde precisa cobrir a página) — aqui, flutuando ao lado do Hero, isso
// criava uma segunda instância do fundo dentro de uma caixa visível.
// Sem background próprio, só o LogoMark (SVG sem fundo) fica por cima
// do LivingBackground real da página, sem emenda.
//
// hasPlayedHomeIntro: variável de módulo (não estado do componente) —
// Home desmonta por completo toda vez que a navegação troca de seção
// (architecture.md §3, um componente montado por vez), então um useState
// aqui reiniciaria a cada volta pra Home. O módulo, por outro lado,
// sobrevive: só reseta com um reload real da página. `instant` (mothership-ds
// v1.5.0) faz o Splash pular a animação de entrada nas remontagens
// seguintes — sem isso, o nome "Mothership" reaparecia centralizado no
// dirigível e refazia a montagem toda vez que a seção voltava a ficar ativa.
let hasPlayedHomeIntro = false;

export function Home({ onNavigate }: { onNavigate: (section: SectionId) => void }) {
  const skipIntro = hasPlayedHomeIntro;
  useEffect(() => {
    hasPlayedHomeIntro = true;
  }, []);

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
        <div className="relative hidden h-96 w-96 shrink-0 lg:block">
          <Splash inline persistent ready instant={skipIntro} style={{ background: "none" }} />
        </div>
      </div>
    </SectionShell>
  );
}

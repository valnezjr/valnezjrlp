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
// styleguide, story "Splash"). Presente em toda largura, não só ≥1024px
// (feedback direto: sumia por completo no mobile) — acima do Hero em
// telas estreitas (`order-first` na coluna, `flex-col`), crescendo e
// indo pro lado a partir de lg (`lg:order-none` volta à ordem do DOM —
// Hero primeiro — que em `lg:flex-row` põe a logo à direita). Tamanho
// mobile passou por três rounds de feedback: `h-28` sumia demais,
// `h-44` (caixa quadrada) ainda parecia "pequena e flutuando num
// padding grande" — o motivo real era a caixa quadrada: o `viewBox` do
// `LogoMark` (dirigível+nome) é bem mais largo que alto (7800×5250 ≈
// 1,49:1), então dentro de um quadrado ele sempre desenhava com
// bastante espaço morto em cima/embaixo (letterbox), por menor que a
// caixa fosse. `aspect-[52/35]` (mesma proporção do viewBox,
// 7800/5250 simplificado) faz a caixa casar com o desenho — preenche
// de verdade, sem aumentar a altura ocupada na página. Mesmo preenchida,
// ainda ficava "pequena" pro gosto — o espaço vertical realmente livre
// varia MUITO por altura de tela (iPhone SE a 667px tem bem menos folga
// que um Android a 740px, que tem bem menos que um 844px), então um só
// tamanho por LARGURA deixava folga sem uso nas telas mais altas. Por
// isso os degraus de tamanho (`w-64` → `[@media(min-height:650px)]:w-72`
// → `:700px]:w-80` → `:850px]:w-96`) reagem à ALTURA da viewport, não à
// largura — o Tailwind não tem breakpoint padrão pra isso, só a sintaxe
// arbitrária de media query. `lg:!aspect-auto lg:!h-96 lg:!w-96`
// precisou de `!important`: essas media queries de altura e o `lg:` (de
// largura) do Tailwind têm a mesma especificidade CSS — numa tela que
// bate os dois critérios ao mesmo tempo (ex.: 1024×768, que é `lg` e
// também passa de 700px de altura), sem forçar a prioridade do `lg:` a
// ordem de saída do Tailwind podia deixar o tamanho de altura "vencer"
// por acidente, quebrando o quadrado fixo do desktop.
//
// className="!p-0 lg:..." no Hero: achado ao verificar essa correção —
// `.ms-hero` (mothership-ds) já vem com padding vertical generoso
// próprio (~84px em cima, 56px embaixo, pensado pra um Hero de tela
// cheia usado sozinho), que somado ao padding do SectionShell (que já
// reserva espaço pra navbar) sobrava conteúdo maior que a viewport em
// alturas baixas — o texto ficava atrás da navbar ou cortado embaixo
// em 360×740/375×667/360×640 (critério de aceite do prd.md §7: "nenhuma
// resolução... gera scroll ou conteúdo cortado/atrás da navbar"), sem
// nenhum scroll aparecer (por isso passava despercebido: `overflow:
// hidden` do SectionShell escondia o excesso ao centralizar, não virava
// barra de rolagem). Zerado no mobile (o SectionShell já reserva o
// espaço certo sozinho) e restaurado ao valor original só a partir de
// lg (`!important` via Tailwind porque mothership-ds/styles.css importa
// depois do Tailwind em main.tsx — sem isso a ordem no CSS deixaria a
// regra da lib ganhar do utilitário).
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
      <div className="flex w-full max-w-5xl flex-col items-center gap-4 sm:gap-6 lg:flex-row lg:justify-between lg:gap-8">
        <div className="flex-1">
          <Hero
            className="!p-0 lg:!px-6 lg:!pt-[84px] lg:!pb-14"
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
        <div className="relative order-first aspect-[52/35] w-64 shrink-0 [@media(min-height:650px)]:w-72 [@media(min-height:700px)]:w-80 [@media(min-height:850px)]:w-96 lg:order-none lg:!aspect-auto lg:!h-96 lg:!w-96">
          <Splash inline persistent ready instant={skipIntro} style={{ background: "none" }} />
        </div>
      </div>
    </SectionShell>
  );
}

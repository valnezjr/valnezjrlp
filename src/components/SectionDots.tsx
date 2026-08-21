import { SECTIONS, type SectionId } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Indicador de navegação por dots — extra do roteiro (§ Extras),
 * lateral e discreto, clicável. Fixo na borda direita, centralizado na
 * altura da viewport.
 *
 * Não reaproveita o `StepIndicator` do mothership-ds (mesma classe
 * visual usada pela paginação da `Gallery`, `docs/architecture.md`
 * decisões #18-22): aquele é horizontal por design (o dot ativo cresce
 * em LARGURA, `--dot-size-active`, pra virar uma pílula deitada — bullet
 * de carrossel/paginação) e sua semântica é sequencial ("Etapa X de Y"),
 * enquanto a navegação daqui é por seção nomeada e não-linear (qualquer
 * dot pode ser o próximo clique, não só o vizinho). Mesmo caso da Navbar
 * (decisão #5): reaproveita só os tokens de cor (`var(--color-*)`), não
 * o componente pronto, porque o comportamento não é o mesmo.
 *
 * Posição validada com Playwright (não só suposta): `SectionShell`
 * sempre reserva `px-6` (24px) de cada lado do conteúdo real, em
 * qualquer largura testada — de 360px a 1920px, nas 4 seções — então o
 * rail cabe dentro dessa margem sem nunca disputar espaço com o
 * conteúdo, sem precisar esconder abaixo de nenhum breakpoint.
 */
export function SectionDots({
  active,
  onNavigate,
}: {
  active: SectionId;
  onNavigate: (section: SectionId) => void;
}) {
  return (
    <nav aria-label="Indicador de seção" className="section-dots">
      {SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          className={cn(
            "section-dots__dot",
            active === section.id && "section-dots__dot--active",
          )}
          aria-label={`Ir para ${section.label}`}
          aria-current={active === section.id ? "page" : undefined}
          onClick={() => onNavigate(section.id)}
        />
      ))}
    </nav>
  );
}

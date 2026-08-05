import { Palette, PenTool, Rocket } from "lucide-react";
import { Card, CardText, HoverEdge } from "mothership-ds";
import { SectionShell } from "@/components/SectionShell";

// docs/prd.md §5.2. Grid de 3 colunas no desktop, 2 no tablet (a
// terceira sobra sozinha na linha de baixo, esperado pelo roteiro),
// empilhado no mobile — não carrossel: só 3 itens curtos, um carrossel
// seria mecanismo demais pra pouco conteúdo (architecture.md § Registro
// de decisões).
const SERVICES = [
  {
    icon: Palette,
    title: "Brand Design",
    description:
      "Identidade visual completa, do conceito à aplicação — sua marca com consistência em cada ponto de contato.",
  },
  {
    icon: PenTool,
    title: "UI/UX Design",
    description:
      "Interfaces desenhadas com foco em quem usa: experiência clara, acessível e alinhada ao seu produto.",
  },
  {
    icon: Rocket,
    title: "Product Design",
    description: "Do conceito ao produto funcional, ponta a ponta — cuidando de cada etapa do processo.",
  },
] as const;

export function Servicos() {
  return (
    <SectionShell>
      <h1 className="ms-h1" style={{ marginBottom: "var(--space-2)" }}>
        O que eu faço
      </h1>
      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map(({ icon: Icon, title, description }) => (
          <HoverEdge key={title} colors={["var(--color-accent)", "var(--color-violet)"]}>
            <Card>
              <Icon
                aria-hidden="true"
                size={22}
                color="var(--color-accent)"
                style={{ marginBottom: "var(--space-2)" }}
              />
              <p className="ms-card__title">{title}</p>
              <CardText>{description}</CardText>
            </Card>
          </HoverEdge>
        ))}
      </div>
    </SectionShell>
  );
}

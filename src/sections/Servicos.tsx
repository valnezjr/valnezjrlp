import { useState } from "react";
import { MonitorSmartphone, Palette, Printer } from "lucide-react";
import { Badge, Card, CardText, HoverEdge, Modal } from "mothership-ds";
import { SectionShell } from "@/components/SectionShell";

// docs/prd.md §5.2. Reorganizado de 3 serviços soltos pra 3 categorias
// com subitens — cada card abre um Modal com a descrição completa e os
// subitens (Badge), em vez de listar tudo direto no card.
const SERVICE_CATEGORIES = [
  {
    icon: MonitorSmartphone,
    title: "Digital Design",
    description:
      "Produtos digitais pensados de ponta a ponta — da interface ao sistema que sustenta tudo.",
    items: ["UI/UX Design", "Product Design", "Design System"],
  },
  {
    icon: Palette,
    title: "Brand Design",
    description:
      "Identidade visual completa, do conceito à aplicação em cada ponto de contato da marca.",
    items: ["Branding", "Identidade Visual"],
  },
  {
    icon: Printer,
    title: "Print",
    description: "Peças físicas com o mesmo cuidado do digital, prontas pra produção.",
    items: ["Design de Embalagem", "Peças Gráficas"],
  },
] as const;

type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export function Servicos() {
  const [open, setOpen] = useState(false);
  // Fica com o último valor durante a animação de saída do Modal (só
  // `open` vira false) — limpar junto zeraria o conteúdo no meio do fade.
  const [selected, setSelected] = useState<ServiceCategory | null>(null);

  function openCategory(category: ServiceCategory) {
    setSelected(category);
    setOpen(true);
  }

  return (
    <SectionShell>
      <h1 className="ms-h1" style={{ marginBottom: "var(--space-2)" }}>
        O que eu faço
      </h1>
      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.title}
              type="button"
              onClick={() => openCategory(category)}
              className="h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left"
              style={{ font: "inherit" }}
            >
              {/* h-full em cada nível: o item do grid já estica sozinho
                  (align-items: stretch, padrão), mas HoverEdge/Card não
                  herdam altura automaticamente — sem isso, o card com
                  descrição mais curta ficava menor que os outros dois,
                  com o anel de hover (dimensionado pelo HoverEdge, que
                  aí ainda ficava do tamanho certo) sobrando abaixo do
                  card visível. */}
              <HoverEdge colors={["var(--color-accent)", "var(--color-violet)"]} className="h-full">
                <Card className="h-full">
                  <Icon
                    aria-hidden="true"
                    size={22}
                    color="var(--color-accent)"
                    style={{ marginBottom: "var(--space-2)" }}
                  />
                  <p className="ms-card__title">{category.title}</p>
                  <CardText>{category.description}</CardText>
                </Card>
              </HoverEdge>
            </button>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={selected?.title}>
        {selected && (
          <>
            <p className="ms-text-sm ms-text-muted" style={{ marginBottom: "var(--space-4)" }}>
              {selected.description}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {selected.items.map((item) => (
                <Badge key={item} tone="accent">
                  {item}
                </Badge>
              ))}
            </div>
          </>
        )}
      </Modal>
    </SectionShell>
  );
}

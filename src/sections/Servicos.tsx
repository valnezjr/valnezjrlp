import { useState } from "react";
import {
  Component,
  LayoutGrid,
  Layers,
  MonitorSmartphone,
  Newspaper,
  Package,
  Palette,
  Printer,
  Sparkles,
} from "lucide-react";
import { Badge, Card, CardText, HoverEdge, Modal, type Tone } from "mothership-ds";
import { SectionShell } from "@/components/SectionShell";

interface ServiceItem {
  label: string;
  // Mesmo tipo gerado pra qualquer ícone lucide-react — não é exportado
  // por nome (LucideIcon) no pacote, então deriva de um ícone real.
  icon: typeof Palette;
  tone: Tone;
}

// docs/prd.md §5.2. Reorganizado de 3 serviços soltos pra 3 categorias
// com subitens — cada card abre um Modal com a descrição completa e um
// mini bento grid decorativo (um ícone por subitem, cor do sistema
// rotacionada, estética "neoglass" das badges de estado/status).
const SERVICE_CATEGORIES = [
  {
    icon: MonitorSmartphone,
    title: "Digital Design",
    description:
      "Produtos digitais pensados de ponta a ponta — da interface ao sistema que sustenta tudo.",
    items: [
      { label: "UI/UX Design", icon: LayoutGrid, tone: "accent" },
      { label: "Product Design", icon: Layers, tone: "violet" },
      { label: "Design System", icon: Component, tone: "pink" },
    ] satisfies ServiceItem[],
  },
  {
    icon: Palette,
    title: "Brand Design",
    description:
      "Identidade visual completa, do conceito à aplicação em cada ponto de contato da marca.",
    items: [
      { label: "Branding", icon: Palette, tone: "highlight" },
      { label: "Identidade Visual", icon: Sparkles, tone: "success" },
    ] satisfies ServiceItem[],
  },
  {
    icon: Printer,
    title: "Print",
    description: "Peças físicas com o mesmo cuidado do digital, prontas pra produção.",
    items: [
      { label: "Design de Embalagem", icon: Package, tone: "orange" },
      { label: "Peças Gráficas", icon: Newspaper, tone: "accent" },
    ] satisfies ServiceItem[],
  },
] as const;

type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

/** Mini bento decorativo do topo do Modal — um ícone por subitem, cor do
 * sistema por tile, mesmo par vidro-fosco + borda tonal das badges de
 * estado (`.ms-badge--{tone}`), com o hover reativo padrão (HoverEdge). */
function ServiceModalBento({ items }: { items: readonly ServiceItem[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 36px)",
        gap: "var(--space-2)",
        marginLeft: "auto",
      }}
    >
      {items.map(({ icon: Icon, tone }, i) => (
        <HoverEdge
          key={i}
          radius="8px"
          scale={1.08}
          colors={[`var(--color-${tone})`, `var(--color-${tone})`]}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 8,
              border: `1px solid var(--color-${tone})`,
              background: `var(--color-${tone}-soft)`,
            }}
          >
            <Icon size={16} color={`var(--color-${tone})`} aria-hidden />
          </div>
        </HoverEdge>
      ))}
    </div>
  );
}

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
            <div style={{ display: "flex", marginBottom: "var(--space-3)" }}>
              <ServiceModalBento items={selected.items} />
            </div>
            <p className="ms-text-sm ms-text-muted" style={{ marginBottom: "var(--space-4)" }}>
              {selected.description}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {selected.items.map(({ label }) => (
                <Badge key={label} tone="accent">
                  {label}
                </Badge>
              ))}
            </div>
          </>
        )}
      </Modal>
    </SectionShell>
  );
}

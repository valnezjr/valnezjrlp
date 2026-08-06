import { useEffect, useState } from "react";
import { Avatar, Badge, Button, Card, HoverEdge, Modal, StepIndicator } from "mothership-ds";
import { SectionShell } from "@/components/SectionShell";

// docs/prd.md §5.3 — apresentação, competências e projetos ainda estão
// [PENDENTE] (Valnez organizando o conteúdo real). O que segue é
// placeholder estrutural pra validar o layout/paginação — trocar
// PLACEHOLDER_PROJECTS e o texto de apresentação pelo conteúdo real
// antes de considerar a seção pronta.
interface Project {
  title: string;
  description: string;
  tags: string[];
}

const PLACEHOLDER_PROJECTS: Project[] = Array.from({ length: 9 }, (_, i) => ({
  title: `Projeto ${i + 1}`,
  description: "Descrição breve do projeto — texto placeholder até o conteúdo real entrar aqui.",
  tags: ["Placeholder"],
}));

// Galeria paginada (mothership-ds StepIndicator, v1.6.0) em vez de um
// Gallery/grid que cresce em altura: architecture.md §4 proíbe scroll
// interno, então "quantos projetos forem necessários" só cabe como
// páginas (que aumentam em número, não em altura), nunca como lista que
// rola. 4 por página no mobile (grid 2×2), 6 a partir de sm (grid 3×2)
// — largura real disponível muda o quanto cabe por vez.
function useItemsPerPage() {
  const [itemsPerPage, setItemsPerPage] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches ? 6 : 4,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const onChange = () => setItemsPerPage(mq.matches ? 6 : 4);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return itemsPerPage;
}

export function Sobre() {
  const itemsPerPage = useItemsPerPage();
  const totalPages = Math.max(1, Math.ceil(PLACEHOLDER_PROJECTS.length / itemsPerPage));
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Project | null>(null);

  // Evita ficar preso numa página que deixou de existir depois de um
  // resize (ex.: estava na página 3 de 3 no mobile, a tela cresce pra
  // sm e passa a ter só 2 páginas de 6).
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * itemsPerPage;
  const visible = PLACEHOLDER_PROJECTS.slice(start, start + itemsPerPage);

  return (
    <SectionShell>
      <div className="flex w-full max-w-4xl flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-1 text-center">
          <Avatar size="sm" initials="VJ" alt="Valnez Júnior" />
          <div>
            <h1 className="ms-h2" style={{ marginBottom: "var(--space-1)" }}>
              Sobre
            </h1>
            <p className="ms-text-xs ms-text-muted" style={{ maxWidth: 480 }}>
              [Apresentação breve — pendente, ver docs/prd.md §5.3]
            </p>
          </div>
        </div>

        {/* Card do mothership-ds tem padding: var(--space-5) (24px) por
            padrão, pensado pra conteúdo mais espaçoso (ver Servicos.tsx)
            — bom demais pra uma grade densa que precisa caber, com o
            bloco de apresentação e o paginador, numa viewport de só
            600px de altura (o caso baixo documentado, decisão #7).
            style={{padding}} sobrepõe (Card espalha ...rest), igual ao
            truque já usado no Hero da Home. Foto com altura fixa (não
            aspect-ratio): numa coluna de ~300px de largura no desktop
            (grid de 3), aspect-ratio 4/3 infla a foto pra ~225px de
            altura sozinha — fixo em 48px, a foto não cresce junto com a
            coluna. */}
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
          {visible.map((project) => (
            <button
              key={project.title}
              type="button"
              onClick={() => setSelected(project)}
              className="h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left"
              style={{ font: "inherit" }}
            >
              <HoverEdge colors={["var(--color-accent)", "var(--color-violet)"]} className="h-full">
                <Card className="h-full" style={{ padding: "var(--space-2)" }}>
                  <div
                    aria-hidden="true"
                    style={{
                      height: 48,
                      borderRadius: "var(--radius-md)",
                      background: "linear-gradient(135deg, var(--bg-glow-2), var(--bg-glow-3))",
                      marginBottom: "var(--space-1)",
                    }}
                  />
                  <p className="ms-text-xs" style={{ fontWeight: "var(--font-weight-medium)" }}>
                    {project.title}
                  </p>
                </Card>
              </HoverEdge>
            </button>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <StepIndicator current={currentPage} total={totalPages} showCount label="Página" />
            <Button inline size="sm" variant="ghost" disabled={currentPage === 0} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button
              inline
              size="sm"
              variant="solid"
              disabled={currentPage === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Próximo
            </Button>
          </div>
        )}
      </div>

      <Modal open={selected != null} onClose={() => setSelected(null)} title={selected?.title}>
        {selected && (
          <>
            <p className="ms-text-sm ms-text-muted" style={{ marginBottom: "var(--space-4)" }}>
              {selected.description}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {selected.tags.map((tag) => (
                <Badge key={tag} tone="accent">
                  {tag}
                </Badge>
              ))}
            </div>
          </>
        )}
      </Modal>
    </SectionShell>
  );
}

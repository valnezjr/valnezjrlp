import { useEffect, useState } from "react";
import { Avatar, Gallery, type GalleryCategory, type GalleryItem } from "mothership-ds";
import { SectionShell } from "@/components/SectionShell";

// docs/prd.md §5.3 — apresentação, competências e projetos ainda estão
// [PENDENTE] (Valnez organizando o conteúdo real). O que segue é
// placeholder estrutural pra validar layout/paginação/filtro — trocar
// PLACEHOLDER_PROJECTS e o texto de apresentação pelo conteúdo real
// antes de considerar a seção pronta.
const CATEGORIES: GalleryCategory[] = [
  { key: "digital", label: "Digital Design", tone: "accent" },
  { key: "brand", label: "Brand Design", tone: "highlight" },
  { key: "print", label: "Print", tone: "orange" },
];

const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg,#6b4796,#00a7da)",
  "linear-gradient(135deg,#63256b,#ffd000)",
  "linear-gradient(135deg,#2e3f5e,#00d68f)",
  "linear-gradient(135deg,#004357,#6b4796)",
  "linear-gradient(135deg,#ff4d6d,#63256b)",
  "linear-gradient(135deg,#00a7da,#00d68f)",
];

const PLACEHOLDER_PROJECTS: GalleryItem[] = Array.from({ length: 9 }, (_, i) => ({
  image: PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length],
  title: `Projeto ${i + 1}`,
  description: "Descrição breve do projeto — texto placeholder até o conteúdo real entrar aqui.",
  categories: [CATEGORIES[i % CATEGORIES.length].key],
}));

// Gallery (mothership-ds v1.7.0) com itemsPerPage: paginação nativa em
// vez de crescer em altura, sem abrir mão de filtro/badges/cores de
// categoria — a primeira versão desta seção tinha reimplementado uma
// grade "parecida" com Gallery do zero (achando que o componente real
// não dava pra paginar) e saiu sem nada da identidade visual real dela;
// feedback direto apontou o problema.
//
// .ms-gallery__grid é auto-fill com colunas de no mínimo 220px — numa
// tela estreita (~320px de área útil), isso vira 1 coluna só, e cada
// card de Gallery (foto 4:3 + padding) passa de 250px de altura, então
// mesmo 2 itens empilhados já não caberiam nos ~600px de altura mais
// baixa que este projeto precisa suportar (decisão #7). `.portfolio-
// gallery` (index.css) fixa as colunas por breakpoint (2 estreito, 3 a
// partir de sm, 5 quando largo E baixo — notebook com barras do
// navegador, altura curta mas largura de sobra pra encolher o card na
// horizontal) pra manter a altura por item previsível o bastante pra
// calcular quantos cabem por página sem estourar a viewport. Sempre 1
// linha só: mesmo em alturas generosas (900px), 2 linhas do card real
// da Gallery (foto 4:3 + badges + descrição) já não cabe — testado e
// estourava. Os degraus abaixo só variam o número de colunas visíveis
// numa linha (2/espelhando 3/5 do index.css), nunca o de linhas.
function useItemsPerPage() {
  const compute = () => {
    if (typeof window === "undefined") return 3;
    const wide = window.matchMedia("(min-width: 640px)").matches;
    const short = window.matchMedia("(max-height: 700px)").matches;
    if (wide && short) return 5; // 5 colunas (index.css)
    if (wide) return 3; // 3 colunas
    return 2; // 2 colunas
  };

  const [itemsPerPage, setItemsPerPage] = useState(compute);

  useEffect(() => {
    const queries = [
      window.matchMedia("(min-width: 640px)"),
      window.matchMedia("(max-height: 700px)"),
    ];
    const onChange = () => setItemsPerPage(compute());
    queries.forEach((mq) => mq.addEventListener("change", onChange));
    onChange();
    return () => queries.forEach((mq) => mq.removeEventListener("change", onChange));
  }, []);

  return itemsPerPage;
}

export function Sobre() {
  const itemsPerPage = useItemsPerPage();

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

        <Gallery
          className="portfolio-gallery w-full"
          categories={CATEGORIES}
          items={PLACEHOLDER_PROJECTS}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </SectionShell>
  );
}

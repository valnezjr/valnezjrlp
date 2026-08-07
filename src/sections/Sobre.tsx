import { useEffect, useState } from "react";
import { Avatar, Gallery, Modal, type GalleryCategory, type GalleryItem } from "mothership-ds";
import { SectionShell } from "@/components/SectionShell";

// docs/prd.md §5.3 — apresentação (parágrafo abaixo do "Sobre") já é
// texto final, revisado como copy em 2026-08-06 (segunda rodada:
// "atendo startups... e pequenos e médios negócios" no lugar do eixo
// Rio-SP, pra não soar exclusivo a startups). Cortado pra caber no
// espaço curto reservado (ms-text-xs, sem sobra de altura na seção —
// decisão #7) sem perder os fatos centrais (desde quando,
// especialização, quem atende); max-w-[480px] sm:max-w-[620px] dá mais
// largura a partir de sm especificamente pra 1366×600 não quebrar numa
// 3ª linha. Competências (badges) continuam [PENDENTE] — falta o
// conteúdo real de Valnez.
const CATEGORIES: GalleryCategory[] = [
  { key: "digital", label: "Digital Design", tone: "accent" },
  { key: "brand", label: "Brand Design", tone: "highlight" },
];

// Projetos reais (public/portfolio/*.pdf — case studies de 6 páginas
// cada, texto extraído dos próprios PDFs pra manter a copy consistente
// com o que já existe neles). Sem categoria "print" (decisão #17 do
// Servicos oferece o serviço, mas não há case completo dela ainda) —
// melhor não mostrar um filtro que sempre dá vazio.
interface Project {
  file: string;
  title: string;
  description: string;
  category: "digital" | "brand";
}

const PROJECTS: Project[] = [
  { file: "01-lp-bones-express", title: "Bonés Express", description: "Landing page de captação de orçamento para fábrica de bonés personalizados.", category: "digital" },
  { file: "02-lp-museu-mastodonte", title: "Museu Mastodonte", description: "Landing page editorial para museu de história natural.", category: "digital" },
  { file: "03-lp-hotel-fenix", title: "Hotel Fênix", description: "Landing page de reserva para hotel em Campina Grande.", category: "digital" },
  { file: "04-lp-bone-da-gente", title: "Boné da Gente", description: "Landing page institucional para fábrica de bonés personalizados.", category: "digital" },
  { file: "05-app-gestao-beauty", title: "Precificação Beauty", description: "App de precificação e gestão para profissionais de beleza e estética.", category: "digital" },
  { file: "06-app-polo-wear-bonus", title: "Polo Wear Bonus", description: "App de programa de bônus para clientes da marca Polo Wear.", category: "digital" },
  { file: "07-app-pda-schedule", title: "PDA Agendamento", description: "App de agenda e ponto para prestadores de serviço terceirizados.", category: "digital" },
  { file: "08-web-projeto-fmc", title: "Projeto FMC", description: "Portal de classificados com busca geolocalizada e perfis verificados.", category: "digital" },
  { file: "09-app-fgw-construtora", title: "FGW Construtora", description: "App de gestão financeira de obras para construtora.", category: "digital" },
  { file: "10-dev-decore-casa-textil", title: "Decore Casa Têxtil", description: "Landing page de captação para atacado de cama, mesa e banho — design e código.", category: "digital" },
  { file: "11-dev-mothership-ds", title: "Mothership DS", description: "Design system próprio em React, aberto ao público via GitHub.", category: "digital" },
  { file: "12-id-rc-strong", title: "RC Strong", description: "Rebranding de identidade visual para academia.", category: "brand" },
  { file: "13-id-blooming-acessorios", title: "Blooming Acessórios", description: "Branding para marca de acessórios femininos.", category: "brand" },
  { file: "14-id-andre-azevedo", title: "André Azevedo Nutricionista", description: "Branding para marca pessoal de nutricionista.", category: "brand" },
];

// import.meta.env.BASE_URL: "/" no dev, "/valnezjrlp/" em produção
// (vite.config.ts — GitHub Pages de projeto serve sob subpasta). Sem
// isso os PDFs/thumbs quebrariam só no ar, nunca localmente.
const BASE = import.meta.env.BASE_URL;

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
  // Fica com o último projeto durante o fade de saída do Modal (só
  // `open` vira false) — limpar junto cortaria o PDF no meio da
  // animação, mesmo padrão já usado em Servicos.tsx.
  const [selected, setSelected] = useState<Project | null>(null);

  const items: GalleryItem[] = PROJECTS.map((project) => ({
    image: `url(${BASE}portfolio/thumbs/${project.file}.png)`,
    title: project.title,
    description: project.description,
    categories: [project.category],
    onClick: () => setSelected(project),
  }));

  return (
    <SectionShell>
      <div className="flex w-full max-w-4xl flex-col items-center gap-2">
        <div className="flex flex-col items-center gap-1 text-center">
          <Avatar size="sm" initials="VJ" alt="Valnez Júnior" />
          <div>
            <h1 className="ms-h2" style={{ marginBottom: 0 }}>
              Sobre
            </h1>
            <p className="ms-text-xs ms-text-muted max-w-[480px] sm:max-w-[620px]">
              Designer desde 2018, especializado em web/app design desde 2022 — atendo remotamente
              startups de tecnologia e pequenos e médios negócios. Vamos produzir juntos?
            </p>
          </div>
        </div>

        <Gallery
          className="portfolio-gallery w-full"
          categories={CATEGORIES}
          items={items}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Gallery.onClick (mothership-ds v1.7.0) abre o case completo (o
          PDF) por cima da página, mesma exibição de qualquer Modal —
          véu com blur, fecha no X ou clique fora (Modal já faz isso
          sozinho, dismissable por padrão). Pedido direto: abrir o PDF
          "parecido com os modais", não um viewer/rota nova.

          size="full" (mothership-ds, upstream) em vez de "lg": feedback
          direto de que 880px ficava pequeno demais pra ler o PDF
          confortavelmente. .ms-modal__body já é flex:1 — com "full"
          dando height:100% ao Modal, o iframe com height:100% preenche
          o espaço de verdade (quase toda a viewport), não uma altura
          chutada em vh. */}
      <Modal open={selected != null} onClose={() => setSelected(null)} title={selected?.title} size="full">
        {selected && (
          <iframe
            key={selected.file}
            src={`${BASE}portfolio/${selected.file}.pdf`}
            title={selected.title}
            style={{ width: "100%", height: "100%", border: "none", borderRadius: "var(--radius-md)" }}
          />
        )}
      </Modal>
    </SectionShell>
  );
}

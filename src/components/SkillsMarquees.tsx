import { Badge, Marquee } from "mothership-ds";
import figmaSvg from "@/assets/tool-logos/figma.svg?raw";
import illustratorSvg from "@/assets/tool-logos/illustrator.svg?raw";
import photoshopSvg from "@/assets/tool-logos/photoshop.svg?raw";
import canvaSvg from "@/assets/tool-logos/canva.svg?raw";
import corelDrawSvg from "@/assets/tool-logos/coreldraw.svg?raw";
import affinitySvg from "@/assets/tool-logos/affinity.svg?raw";
import penpotSvg from "@/assets/tool-logos/penpot.svg?raw";
import inkscapeSvg from "@/assets/tool-logos/inkscape.svg?raw";
import gimpSvg from "@/assets/tool-logos/gimp.svg?raw";

// docs/prd.md §5.3 — competências enviadas por Valnez (2026-08-12),
// texto exatamente como recebido (só padronizando maiúsculas conforme
// as outras disciplinas já grafadas em §5.2: "UI/UX Design", "Brand
// Design", "Product Design").
const COMPETENCIAS = [
  "Brand Design",
  "UI/UX Design",
  "Diagramação e Prototipação",
  "Product Design",
  "Front-end",
];

interface Tool {
  name: string;
  svg: string;
  /** Alternativa open source citada por Valnez — vira detalhe no title/aria, não um badge visual extra (a marquee já é compacta demais pra sobrar espaço). */
  ossAlternativeTo?: string;
}

// Logos reais, baixadas uma vez e versionadas em src/assets/tool-logos/
// (não é CDN em runtime — decisão #17 já rejeitou dependência de rede
// externa a cada visita, mesmo princípio aqui). Fontes e licenças por
// arquivo: docs/architecture.md § Registro de decisões #39. Todos os IDs
// internos (gradientes, <use>) foram reprefixados por arquivo via svgo
// (prefixIds) antes de versionar — os SVGs são injetados crus na mesma
// página (dangerouslySetInnerHTML) e o Marquee ainda duplica cada um pra
// loop contínuo, então IDs genéricos como "a"/"b" colidiam entre
// arquivos diferentes e corrompiam o fill um do outro (decisão #41).
const TOOLS: Tool[] = [
  { name: "Figma", svg: figmaSvg },
  { name: "Illustrator", svg: illustratorSvg },
  { name: "Photoshop", svg: photoshopSvg },
  { name: "Canva", svg: canvaSvg },
  { name: "CorelDRAW", svg: corelDrawSvg },
  // "Affinity" — em out/2025 a Serif (Canva) unificou Designer/Photo/
  // Publisher num app único "Affinity" com marca nova (decisão #41);
  // não faz mais sentido nomear "Affinity Designer" separado.
  { name: "Affinity", svg: affinitySvg },
  { name: "Penpot", svg: penpotSvg, ossAlternativeTo: "Figma" },
  { name: "Inkscape", svg: inkscapeSvg, ossAlternativeTo: "Illustrator/CorelDRAW" },
  { name: "GIMP", svg: gimpSvg, ossAlternativeTo: "Photoshop" },
];

/**
 * Duas faixas de marquee (mothership-ds) abaixo da apresentação em
 * Sobre.tsx: competências (docs/prd.md §5.3) e ferramentas (pedido
 * direto, fora do PRD original — registrado como decisão #39). Sentidos
 * opostos (competências pra esquerda, ferramentas pra direita) só pra
 * não parecerem a mesma faixa se movendo junto por coincidência visual.
 * `pauseOnHover` + `fade`: mesmas duas props em ambas, sem inventar
 * comportamento diferente entre as duas faixas.
 */
export function SkillsMarquees() {
  return (
    <div className="skills-marquees flex w-full shrink-0 flex-col gap-3">
      <Marquee gap="sm" speed="slow" pauseOnHover fade aria-label="Competências">
        {COMPETENCIAS.map((competencia) => (
          <Badge key={competencia}>{competencia}</Badge>
        ))}
      </Marquee>
      <Marquee gap="sm" speed="slow" direction="right" pauseOnHover fade aria-label="Ferramentas">
        {TOOLS.map((tool) =>
          tool.ossAlternativeTo ? (
            // a11y-004 (.audit/): a relação com a alternativa open source
            // só existia no `title`, que não é exposto por toque nem
            // alcançável por teclado (Badge não é focável por padrão) —
            // achado real da auditoria. `data-tip` (TooltipProvider,
            // montado em App.tsx) reage a ponteiro E a foco desde
            // mothership-ds#fbd40fa (docs/architecture.md § Registro de
            // decisões #47) — `tabIndex={0}` é o que falta pra esta
            // badge específica virar um tab stop de verdade; as outras
            // (sem informação extra além do nome já visível como texto)
            // continuam fora da ordem de tab, sem necessidade.
            <Badge
              key={tool.name}
              className="tool-badge"
              tabIndex={0}
              data-tip={`${tool.name} — alternativa open source a ${tool.ossAlternativeTo}`}
            >
              <span className="tool-badge__icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: tool.svg }} />
              {tool.name}
            </Badge>
          ) : (
            <Badge key={tool.name} className="tool-badge" title={tool.name}>
              <span className="tool-badge__icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: tool.svg }} />
              {tool.name}
            </Badge>
          ),
        )}
      </Marquee>
    </div>
  );
}

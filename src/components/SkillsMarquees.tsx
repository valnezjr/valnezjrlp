import { Badge, Marquee } from "mothership-ds";
import figmaSvg from "@/assets/tool-logos/figma.svg?raw";
import illustratorSvg from "@/assets/tool-logos/illustrator.svg?raw";
import photoshopSvg from "@/assets/tool-logos/photoshop.svg?raw";
import canvaSvg from "@/assets/tool-logos/canva.svg?raw";
import corelDrawSvg from "@/assets/tool-logos/coreldraw.svg?raw";
import affinitySvg from "@/assets/tool-logos/affinity-designer.svg?raw";
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
// arquivo: docs/architecture.md § Registro de decisões #39.
const TOOLS: Tool[] = [
  { name: "Figma", svg: figmaSvg },
  { name: "Illustrator", svg: illustratorSvg },
  { name: "Photoshop", svg: photoshopSvg },
  { name: "Canva", svg: canvaSvg },
  { name: "CorelDRAW", svg: corelDrawSvg },
  { name: "Affinity Designer", svg: affinitySvg },
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
    <div className="skills-marquees flex w-full shrink-0 flex-col gap-0.5">
      <Marquee gap="sm" speed="slow" pauseOnHover fade aria-label="Competências">
        {COMPETENCIAS.map((competencia) => (
          <Badge key={competencia}>{competencia}</Badge>
        ))}
      </Marquee>
      <Marquee gap="sm" speed="slow" direction="right" pauseOnHover fade aria-label="Ferramentas">
        {TOOLS.map((tool) => (
          <Badge
            key={tool.name}
            className="tool-badge"
            title={tool.ossAlternativeTo ? `${tool.name} — alternativa open source a ${tool.ossAlternativeTo}` : tool.name}
          >
            <span className="tool-badge__icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: tool.svg }} />
            {tool.name}
          </Badge>
        ))}
      </Marquee>
    </div>
  );
}

# PRD — Landing Page de Serviços

> Fonte da verdade sobre **o que** o site é e **o que** cada seção contém.
> O Claude Code deve consultar este arquivo ao implementar qualquer seção.
> Estrutura técnica: ver `architecture.md`. Convenções de código: ver `CLAUDE.md`.

## 1. Objetivo

Divulgar os serviços de Valnez Júnior, Designer Engineer, e converter visitantes em contato direto (WhatsApp, e-mail ou Instagram).

**Métrica de sucesso:** visitante entende o que ofereço em menos de 10 segundos e tem no máximo 2 cliques até me contatar.

## 2. Público-alvo

- Negócios locais da região, contratando como profissional independente.
- Empresas de pequeno/médio porte de tecnologia, contratando como prestador de serviço terceirizado.

## 3. Proposta de valor

"Do componente ao sistema, dos tokens à identidade visual finalizada — projeto completo, acessível e de qualidade para a sua marca."

## 4. Requisitos de produto

- Página única, sem scroll, 100% da viewport, em pt-BR.
- 4 seções navegáveis como "páginas": Home, Serviços, Sobre/Portfólio, Contato.
- Navbar flutuante sempre visível; seção ativa destacada.
- Transição fade entre seções (400–500ms), respeitando prefers-reduced-motion.
- Funcional de 360px a 1920px de largura, incluindo alturas baixas (~600px úteis).
- Contato só por link direto (WhatsApp, e-mail, Instagram) — sem formulário; decisão de 2026-08-05, o campo de nome/e-mail/mensagem não fazia sentido pra esta seção específica.

## 5. Conteúdo por seção

### 5.1 Home / Hero
- **Título:** "Do componente ao sistema, da marca ao produto."
- **Subtítulo:** Valnez Júnior, Designer Engineer — projetos completos, acessíveis e com identidade, para negócios locais e empresas de tecnologia.
- **CTA primário:** "Fale comigo" → seção Contato
- **CTA secundário:** "Ver serviços" → seção Serviços
- **Visual de apoio:** logo animada da marca (`Splash` do mothership-ds em modo `inline`+`persistent`, decisão de 2026-08-05) — presente em toda largura (decisão de 2026-08-05, revista): menor e acima do texto em telas <1024px, maior e ao lado do texto a partir daí (ver `docs/architecture.md` § Registro de decisões)

> Título/subtítulo acima são rascunho de copy, derivados da proposta de valor (§3) — ajuste à vontade antes da Etapa 4.

### 5.2 Serviços
- **Título da seção:** "O que eu faço"
- **Categorias** (cada card abre um Modal com a descrição completa + subitens):

  | Categoria | Descrição (1–2 linhas) | Subitens | Ícone (lucide) |
  |---|---|---|---|
  | Digital Design | Produtos digitais pensados de ponta a ponta — da interface ao sistema que sustenta tudo. | UI/UX Design, Product Design, Design System | `monitor-smartphone` |
  | Brand Design | Identidade visual completa, do conceito à aplicação em cada ponto de contato da marca. | Branding, Identidade Visual | `palette` |
  | Print | Peças físicas com o mesmo cuidado do digital, prontas pra produção. | Design de Embalagem, Peças Gráficas | `printer` |

> Reorganização pedida em 2026-08-05: de 3 serviços soltos (Brand Design, UI/UX Design, Product Design) pra 3 categorias com subitens. Descrições e nomes dos subitens em português são rascunho meu a partir do que você passou em inglês ("Digital Design (UI/UX, Product Design, Design System), Brand Design (Branding, Visual Identity), Print (Packaging Design, Print Design)") — mantive nomes de disciplina consolidados em inglês (UI/UX Design, Product Design, Design System, Branding, Digital Design, Brand Design, Print — já eram assim antes) e traduzi só os subitens que soam mais naturais em português (Visual Identity → Identidade Visual, Packaging Design → Design de Embalagem, Print Design → Peças Gráficas). Revise à vontade.

### 5.3 Sobre / Portfólio
- **Apresentação:** "Designer desde 2018, especializado em web/app design
  desde 2022 — atendo remotamente startups de tecnologia e pequenos e
  médios negócios. Vamos produzir juntos?" (copy final, 2026-08-06 —
  revisado pra não soar exclusivo a startups). Foto (`Avatar`, ainda
  placeholder — só iniciais "VJ") + parágrafo breve, no topo.
- **Competências (badges):** Brand Design, UI/UX Design, Diagramação e
  Prototipação, Product Design, Front-end (conteúdo real enviado por
  Valnez, 2026-08-12). Exibidas num `Marquee` (mothership-ds) de rolagem
  horizontal contínua, não numa lista estática — pedido direto.
- **Ferramentas:** um segundo `Marquee`, logo abaixo do de competências,
  com logo + nome de cada ferramenta (pedido direto, fora do desenho
  original desta seção): Figma, Illustrator, Photoshop, Canva,
  CorelDRAW, Affinity Designer, e as alternativas open source Penpot
  (Figma), Inkscape (Illustrator/CorelDRAW) e GIMP (Photoshop). Logos
  reais baixadas uma vez e versionadas em `src/assets/tool-logos/` (não
  CDN em runtime — mesmo princípio da decisão de portfólio estático, §5.3
  abaixo) — fontes e licenças por arquivo em `docs/architecture.md` §
  Registro de decisões #39.
- **Projetos:** 14 projetos reais (`public/portfolio/*.pdf` — case
  studies de 6 páginas cada, um por projeto; copy de título/descrição
  extraída dos próprios PDFs), portfólio estático (decisão de
  2026-08-06 — não busca do GitHub; ver `docs/architecture.md` §
  Registro de decisões), no componente `Gallery` do mothership-ds
  abaixo da apresentação — filtro por categoria (Digital Design / Brand
  Design; sem "Print", nenhum case ainda), badges e cores por
  categoria, foto (capa do PDF) e descrição por projeto, exatamente
  como a `Gallery` já funciona em qualquer outro lugar. Paginada
  (`itemsPerPage`, mothership-ds v1.7.0) em vez de crescer em altura —
  quantas colunas couberem numa única linha por página (2 estreito / 3
  a partir de `sm` / 5 quando a tela é larga e baixa ao mesmo tempo).
  **Clique num projeto abre a apresentação do case** por cima da
  página, quase em tela cheia (`Modal` `size="full"`, mothership-ds —
  véu com blur, fecha no X ou clique fora) — `Gallery.onClick` por
  item, mothership-ds v1.7.0. A apresentação é **HTML** (não mais o PDF
  renderizado em canvas — decisão de 2026-08-10, ver `docs/architecture.md`
  § Registro de decisões #33): um fragmento por projeto, gerado pelo
  pipeline próprio de Valnez (pasta de trabalho `catalogo/`, fora do
  git) e servido estático em `public/portfolio-case/{slug}.html`,
  buscado sob demanda (`CaseViewer`, `src/components/CaseViewer.tsx`,
  `React.lazy`) e injetado na página. **O PDF passa a ser só para
  download** — o próprio HTML do case já termina com um botão "Baixar
  PDF", que escolhe a versão desktop ou mobile conforme a largura da
  tela (mesmo corte de 640px de sempre). **Versão mobile própria do
  PDF** (`public/portfolio-mobile/*-mobile.pdf`, 9 páginas em coluna
  única/retrato, reformatada pelo Valnez pra leitura confortável em
  celular sem zoom/scroll horizontal) continua existindo, só que
  exclusivamente para esse download — não é mais renderizada na tela.

> **`[PENDENTE]`** — o material de 2026-08-10 trouxe também um PDF índice
> do portfólio inteiro (`00-Portfolio-Indice.pdf`/`-mobile`, já copiado
> pra `public/portfolio(-mobile)/`), sem relação com nenhum projeto
> específico. Copiado mas **sem link/botão em nenhum lugar da UI ainda**
> — falta decidir se/onde expor (ex.: um "baixar portfólio completo"
> perto do cabeçalho da seção Sobre).

### 5.4 Contato
- **Título:** "Vamos conversar?"
- **Parágrafo:** breve explicação de que o atendimento é por WhatsApp.
- **Sem formulário** — decisão de 2026-08-05: campo de nome/e-mail/
  mensagem removido, não fazia sentido pra esta seção (só pra ela; o
  `Field`/`Input`/`Textarea`/`Button` da lib mothership-ds continuam
  intactos, sem relação com essa decisão).
- **Contatos diretos:** WhatsApp [wa.me/5584996324823](https://wa.me/5584996324823) (+55 84 99632-4823), e-mail valn3zjr@gmail.com, Instagram [@vraunez](https://instagram.com/vraunez).

> Parágrafo do WhatsApp é rascunho meu — revise à vontade: "Prefiro
> atender por WhatsApp — é o canal mais rápido pra tirar dúvidas,
> alinhar escopo ou já começar a conversa sobre o seu projeto."

## 6. Fora de escopo (v1)

- Blog, múltiplas páginas/rotas, CMS, i18n, dark mode toggle [ajuste se quiser algum].
- Backend próprio de e-mail (entra depois).

## 7. Critérios de aceite globais

1. Nenhuma resolução testada gera scroll ou conteúdo cortado/atrás da navbar.
2. Todas as seções acessíveis por navbar, teclado (setas e Tab) e leitores de tela.
3. Build de produção sem erros nem warnings.
4. Nenhuma cor hex hardcoded em componente (só tokens do tema).

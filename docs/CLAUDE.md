# CLAUDE.md — Landing Page de Serviços

Este projeto é uma landing page one-page para divulgação de serviços.

## Documentos do projeto (leia antes de implementar)

- **`docs/prd.md`** — o **quê**: objetivo, público, conteúdo real de cada seção e critérios de aceite. Consulte sempre antes de implementar ou alterar qualquer seção.
- **`docs/architecture.md`** — o **como**: stack, estrutura de pastas, navegação por estado, regras do layout sem scroll e registro de decisões. Consulte antes de qualquer mudança estrutural.
- Ao tomar uma decisão técnica relevante (ex.: lib de animação, estratégia de carrossel), registre-a na tabela "Registro de decisões" do `docs/architecture.md`.
- Em caso de conflito entre documentos, a ordem de prioridade é: CLAUDE.md > architecture.md > prd.md — e avise o usuário sobre o conflito.

## Regras de arquitetura

- Stack: React 18 + Vite + TypeScript + Tailwind CSS (só layout) + **mothership-ds** (biblioteca de componentes padrão do projeto, github.com/valnezjr/mothership-ds).
- A página NUNCA tem scroll: o layout ocupa exatamente 100dvh x 100dvw, com overflow hidden no body.
- A navegação é feita por estado (sem react-router): uma seção ativa por vez, renderizada sob a navbar.
- Seções existentes: Home (hero), Serviços, Sobre/Portfólio, Contato.
- Transição entre seções: fade suave (a seção atual some, a nova aparece), respeitando prefers-reduced-motion.
- Navbar flutuante fixa no topo, funciona como header e menu de navegação.

## Convenções

- Componentes de seção em src/sections/, um arquivo por seção.
- Componentes reutilizáveis do projeto em src/components/ (Navbar, SectionShell — não há mais pasta ui/ gerada; o catálogo de componentes vem do mothership-ds).
- **mothership-ds é a biblioteca de componentes padrão**: usar os componentes exportados por ele (Button, Card, Field/Input/Textarea, Badge, Modal, etc. — catálogo completo no styleguide publicado, https://valnezjr.github.io/mothership-ds/, ou lendo `node_modules/mothership-ds/src/index.ts` pros exports e `src/components/*.tsx` pras props; o `package.json` só inclui `src/`, não `docs/`) sempre que existir equivalente, em vez de reimplementar. Instalado como dependência git presa a uma tag (`package.json`); atualizar a tag manualmente para puxar componentes novos, não seguir `main` (a lib está em desenvolvimento ativo em paralelo).
  - Componentes sem equivalente direto no mothership-ds (ex.: esta própria `Navbar`, que precisa de navegação por estado/clique em vez de `href`+scroll-spy) são construídos localmente reaproveitando as classes CSS públicas da lib (`.ms-navbar`, `.ms-navbar__link`, etc.) em vez de duplicar o visual com Tailwind.
  - `.ms-page` no `#root` (ver `index.html`) é o que liga toda a herança de cor/fonte/foco do mothership-ds — não remover.
  - **Hover-lift da lib** (`.ms-gallery__item`, `.ms-hover-edge` — cresce no `:hover`/`:active`, `translateY(-4px) scale(1.03)`): ao colocar qualquer elemento com esse hover dentro de um container que clipa (`overflow: hidden`, ou `overflow-y: auto` sozinho — vira `overflow-x: hidden` no outro eixo por spec), use `.hover-lift-room` (no ancestral, se o item for clicável de verdade) ou `.hover-lift-off` (no item, se for só decorativo) — ver `src/index.css` § "Hover-lift do mothership-ds" e `docs/architecture.md` § Registro de decisões #37. Já cortou borda duas vezes antes dessa regra existir (decisões #22, #36) — não redescobrir o problema, reaproveitar a solução.
- Cores e tipografia: **só** os tokens do mothership-ds (`var(--color-*)`, `.ms-h1`/`.ms-h2`/`.ms-h3`/`.ms-text-sm`/`.ms-text-muted` etc., herdados via `.ms-page`). Tailwind fica reservado pra layout/posicionamento (flex, grid, espaçamento) — NUNCA pra cor ou tipografia. Nenhuma cor hex hardcoded em componente.
- Textos das seções vêm do docs/prd.md (seção 5). Não inventar conteúdo: se um campo estiver em [colchetes] no PRD, avisar o usuário em vez de improvisar.
- Todo texto visível ao usuário em português (pt-BR).
- Mobile-first: tudo deve funcionar de 360px a 1920px de largura, incluindo alturas baixas (~600px úteis).

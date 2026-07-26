# CLAUDE.md — Landing Page de Serviços

Este projeto é uma landing page one-page para divulgação de serviços.

## Documentos do projeto (leia antes de implementar)

- **`docs/prd.md`** — o **quê**: objetivo, público, conteúdo real de cada seção e critérios de aceite. Consulte sempre antes de implementar ou alterar qualquer seção.
- **`docs/architecture.md`** — o **como**: stack, estrutura de pastas, navegação por estado, regras do layout sem scroll e registro de decisões. Consulte antes de qualquer mudança estrutural.
- Ao tomar uma decisão técnica relevante (ex.: lib de animação, estratégia de carrossel), registre-a na tabela "Registro de decisões" do `docs/architecture.md`.
- Em caso de conflito entre documentos, a ordem de prioridade é: CLAUDE.md > architecture.md > prd.md — e avise o usuário sobre o conflito.

## Regras de arquitetura

- Stack: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui.
- A página NUNCA tem scroll: o layout ocupa exatamente 100dvh x 100dvw, com overflow hidden no body.
- A navegação é feita por estado (sem react-router): uma seção ativa por vez, renderizada sob a navbar.
- Seções existentes: Home (hero), Serviços, Sobre/Portfólio, Contato.
- Transição entre seções: fade suave (a seção atual some, a nova aparece), respeitando prefers-reduced-motion.
- Navbar flutuante fixa no topo, funciona como header e menu de navegação.

## Convenções

- Componentes de seção em src/sections/, um arquivo por seção.
- Componentes reutilizáveis em src/components/ (componentes gerados do shadcn em src/components/ui/).
- Usar componentes do shadcn/ui sempre que existir equivalente (Button, Card, Input, etc.).
- Cores e tipografia: usar os tokens padrão do shadcn por enquanto — um styleguide será fornecido depois e aplicado via CSS variables do tema. NÃO hardcodar cores hex nos componentes; usar sempre as classes semânticas do tema (bg-background, text-foreground, text-muted-foreground, bg-primary, etc.).
- Textos das seções vêm do docs/prd.md (seção 5). Não inventar conteúdo: se um campo estiver em [colchetes] no PRD, avisar o usuário em vez de improvisar.
- Todo texto visível ao usuário em português (pt-BR).
- Mobile-first: tudo deve funcionar de 360px a 1920px de largura, incluindo alturas baixas (~600px úteis).

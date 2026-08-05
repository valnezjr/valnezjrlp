# Architecture — Landing Page de Serviços

> Fonte da verdade sobre **como** o site é construído.
> Conteúdo e requisitos: ver `prd.md`. Convenções de código: ver `CLAUDE.md`.

## 1. Stack

- **React 18 + Vite + TypeScript** — SPA simples, sem SSR (não há necessidade de SEO multi-página numa landing one-page).
- **mothership-ds** — biblioteca de componentes padrão do projeto (github.com/valnezjr/mothership-ds, do próprio autor). Instalada como dependência git presa a uma tag (`"mothership-ds": "github:valnezjr/mothership-ds#v1.3.0"`), não à branch `main` — a lib está em desenvolvimento ativo em paralelo, então a versão só avança quando alguém bumpar a tag de propósito. Não publicada no npm; sem build próprio (`main`/`types` apontam pro `.tsx` fonte direto), o Vite transforma normalmente via esbuild, sem config extra.
- **Tailwind CSS** — só layout/posicionamento (flex, grid, espaçamento). Cor e tipografia são proibidas aqui: vêm inteiramente do mothership-ds (`var(--color-*)`, `.ms-h1`/`.ms-text-sm`/etc.), herdadas via `.ms-page` aplicada no `#root` (`index.html`).
- **lucide-react** — ícones (mothership-ds não embute biblioteca de ícones, por design).
- **motion (framer-motion)** — [ou "CSS transitions puras"] para o fade entre seções. Decisão registrada na etapa de transições.

## 2. Estrutura de pastas

```
src/
├── App.tsx              # Shell: estado de navegação + layout raiz + <ThemeProvider>
├── index.css            # Tailwind (só layout) + import do mothership-ds + regra de no-scroll
├── main.tsx             # importa index.css e mothership-ds/styles.css uma única vez
├── components/
│   ├── Navbar.tsx       # Navbar flutuante (desktop) + menu mobile na Etapa 8 (Drawer do
│   │                     mothership-ds) — reaproveita classes .ms-navbar* do mothership-ds,
│   │                     navegação por estado (não por href)
│   └── SectionShell.tsx # Wrapper comum: padding-top p/ navbar, fade, 100% da área útil
├── sections/
│   ├── Home.tsx
│   ├── Servicos.tsx
│   ├── Sobre.tsx
│   └── Contato.tsx
└── lib/
    ├── navigation.ts    # SectionId, ordem canônica das seções
    ├── utils.ts         # cn() (clsx + tailwind-merge) — só pra classes de layout do Tailwind
    └── content.ts       # [opcional] textos centralizados, espelhando o prd.md
```

Não há mais `components/ui/` — o catálogo de componentes vem do mothership-ds
(instalado em `node_modules/mothership-ds`), não de arquivos gerados no repo.

## 3. Navegação — decisão central

**Sem react-router.** A navegação é por estado:

```ts
type SectionId = "home" | "servicos" | "sobre" | "contato";
// App mantém: const [active, setActive] = useState<SectionId>("home")
```

- Uma seção montada por vez, renderizada sob a navbar.
- **Por quê:** não há URLs distintas a preservar, não há SSR, e rotas reais criariam
  complexidade (scroll restoration, history) sem benefício numa página única.
- Trade-off aceito: sem deep-linking por URL. [Se quiser deep-link depois:
  sincronizar `active` com `location.hash` — mudança pequena e isolada no App.]
- Ordem canônica das seções (para navegação por setas): home → servicos → sobre → contato.

## 4. Layout sem scroll — regras invioláveis

1. Container raiz: `100dvw` x `100dvh` (**dvh, nunca vh** — barra de endereço mobile), `overflow: hidden` em html/body/#root.
2. Navbar: `position: fixed`, flutuante (margens, cantos arredondados, backdrop-blur), sobrepõe o conteúdo.
3. Toda seção usa o `SectionShell`, que já aplica o padding-top compensando a navbar — seções nunca calculam isso individualmente.
4. Se o conteúdo não cabe: adaptar o conteúdo (carrossel, Modal, corte de texto). **Nunca** criar scroll interno ou reduzir fonte abaixo do legível.

## 5. Transições

- Fade-out da seção atual → troca → fade-in da nova (total 400–500ms, ease-in-out, com deslocamento sutil de ~8px no fade-in).
- Navegação bloqueada durante a transição (evita estados intermediários quebrados).
- `prefers-reduced-motion`: troca instantânea.

## 6. Tema e styleguide

- O styleguide **é** o mothership-ds — não é mais um tema aplicado depois por cima de outra biblioteca, é a própria biblioteca de componentes do projeto (decisão #3 abaixo, substitui a original de shadcn/ui + tokens semânticos).
- Todo estilo de cor/tipografia passa pelas CSS variables do mothership-ds (`var(--color-accent)`, `var(--color-text)`, `var(--font-family)`, etc., ver `node_modules/mothership-ds/src/styles/tokens.css`), herdadas via `.ms-page` no `#root`. Tipografia usa as classes utilitárias da lib (`.ms-h1`, `.ms-h2`, `.ms-h3`, `.ms-text-sm`, `.ms-text-xs`, `.ms-text-muted`).
- Tailwind é só pra layout (flex, grid, gap, padding, largura/altura) — nunca pra cor, fonte ou raio de borda.
- Se um dia divergir do tema padrão do mothership-ds só pra este projeto: não editar `node_modules` (some no próximo install); redeclarar as `--color-*`/`--font-family` que quiser depois dos imports em `index.css`.

## 7. Contato

- Sem formulário — só links diretos (WhatsApp, e-mail, Instagram). Decisão de
  2026-08-05: um campo de nome/e-mail/mensagem não fazia sentido pra esta
  seção específica (não é uma remoção do `Field`/`Input`/`Textarea`/`Button`
  da lib mothership-ds, que seguem disponíveis pra qualquer outro uso).
  `lib/sendContact.ts` (a função de envio isolada da v1, pensada pra plugar
  Formspree/EmailJS/API depois) foi removido junto — ficou órfão sem o
  formulário que o chamava.

## 8. Registro de decisões

| # | Decisão | Motivo | Data |
|---|---|---|---|
| 1 | SPA sem router, navegação por estado | Página única, sem necessidade de URLs | [data] |
| 2 | dvh em vez de vh | Barra de endereço mobile quebra 100vh | [data] |
| 3 | mothership-ds como biblioteca de componentes padrão, substituindo shadcn/ui por completo | Biblioteca própria do autor (github.com/valnezjr/mothership-ds); "styleguide futuro" deixou de ser um tema a aplicar depois e passou a ser a própria lib de componentes, usada desde já | 2026-08-05 |
| 4 | Dependência git presa a tag (`#v1.4.0` atualmente), não à branch `main` | mothership-ds está em desenvolvimento ativo em paralelo — seguir `main` quebraria o projeto sem aviso a cada novo commit lá | 2026-08-05 |
| 5 | Navbar do projeto é local (não usa `<Navbar>` do mothership-ds), reaproveitando as classes `.ms-navbar*` | O `<Navbar>` da lib espera links reais (`href`) com scroll-spy; aqui a navegação é por estado/clique, sem URLs (decisão #1) | 2026-08-05 |
| 6 | Transição de fade só com CSS (`@keyframes` + estado do React), sem framer-motion/motion | É um fade sequencial simples (sai → monta a nova → entra) com um leve deslocamento vertical — não precisa de gestos, layout compartilhado (`layoutId`) nem spring physics que justifiquem trazer uma lib nova só pra isso; `useSectionTransition` (`src/lib/`) orquestra sai/monta/entra com dois `setTimeout` casados às durações do CSS | 2026-08-05 |
| 7 | Serviços empilha no mobile (não vira carrossel) | Só 3 itens curtos (ícone + título + 1–2 linhas) — um `Carousel` seria mecanismo demais pra tão pouco conteúdo; empilhado cabe sem scroll até em viewports baixas (testado 360×740 e 1366×600) | 2026-08-05 |
| 8 | Preview de desenvolvimento no GitHub Pages (repo `valnezjr/valnezjrlp`, público — obrigatório pro Pages gratuito), não Vercel/Netlify como o roteiro sugeria | Deploy automático a cada push em `main` via Actions (`.github/workflows/pages.yml`), sem custo/config extra, suficiente pra acompanhar progresso; não é a hospedagem final — sem lib de rotas nem URLs profundas (decisão #1), não há armadilha de SPA fallback pra configurar no Pages | 2026-08-05 |
| 9 | `Modal` do mothership-ds ganha a prop `headerExtra` (upstream, v1.4.0) | `.ms-modal__body` tem `overflow-x: hidden` (reserva de espaço da barra de rolagem) — cortava o hover de ícones com `HoverEdge` no cabeçalho dos modais de Serviços; `.ms-modal__head` não tem essa restrição. Mudança feita na própria lib, não um workaround local | 2026-08-05 |
| 10 | Seção Contato sem formulário — só links diretos (WhatsApp, e-mail, Instagram) | Campo de nome/e-mail/mensagem não fazia sentido pra esta seção específica; `lib/sendContact.ts` removido (ficou órfão). Não é remoção de `Field`/`Input`/`Textarea`/`Button` da lib mothership-ds, que seguem disponíveis | 2026-08-05 |
| 11 | Menu mobile da Navbar usa `Drawer` (`side="right"`), não `.ms-navbar__menu` (o dropdown que o `<Navbar>` do mothership-ds usa por padrão) | Mesmo mecanismo que a `Sidebar` já usa pra própria gaveta mobile (decisão #9) — bem mais simples de reaproveitar (props prontas) do que replicar a lógica de posicionamento/portal do `.ms-navbar__menu`; `side="right"` porque o botão hamburguer cai à direita na `.ms-navbar` custom deste projeto. `.ms-navbar:has(.ms-navbar__burger)` já esconde os links diretos e mostra o hamburguer abaixo de 720px — CSS pronto da lib, nenhuma regra nova precisou ser escrita aqui | 2026-08-05 |
| 12 | [preencher conforme o projeto evoluir] | | |

# Convenções — Mothership DS

Design system em React 18+ / TypeScript, distribuído como código-fonte (sem
etapa de build), com glassmorphism, temas claro/escuro e ~50 componentes.
Autor: Valnez Júnior (Mothership Studios).

Extraído em 2026-08-21, de 18 arquivos de componente em `src/components/`,
mais `CLAUDE.md`, `ARCHITECTURE.md`, `COMPONENT_GUIDELINES.md`,
`ACCESSIBILITY.md`, `TOKENS.md`, `tsconfig.json` e `package.json`.
Reveja quando a stack mudar.

> Este arquivo é o exemplo de referência da skill `audit-convencoes`. Ele é um
> `convencoes.md` real, não uma amostra inventada — inclusive na seção
> "declarado mas não praticado", que registra uma divergência genuína
> encontrada na extração.

---

## Stack real

O que o projeto usa — e, mais importante para a auditoria, o que ele **não**
usa:

| Aspecto | Realidade |
|---|---|
| React | 18+, como `peerDependency`. Nenhuma dependência de runtime além dele |
| TypeScript | 5.5, `strict: true`, `moduleResolution: "Bundler"`, `jsx: "react-jsx"` |
| Build do pacote | **Não existe.** `main` e `types` apontam para `./src/index.ts`; o consumidor transpila |
| Bundler | `esbuild` puro, só para o styleguide. **Sem Vite, sem Webpack, sem Rollup** |
| CSS | Um arquivo global, `src/styles/components.css`, prefixo `ms-`, BEM. **Sem CSS Modules, sem Tailwind, sem CSS-in-JS** |
| Tokens | `src/styles/tokens.css`, fonte única |
| Catálogo | `styleguide/` gerado de `src/` via esbuild. **Sem Storybook** |
| Testes | `npm run typecheck` (`tsc --noEmit`) é a **única** verificação automatizada. **Sem Vitest, sem Jest, sem Testing Library**. Validação é visual, nos dois temas, abaixo de 720px |
| Organização | Arquivos por **área**, não um por componente. **Sem atomic design** (`atoms/`, `molecules/`, `organisms/`) |
| Ícones | `lucide-react` é recomendação, **não dependência**. Componentes aceitam `ReactNode` e nunca importam um ícone específico |

Consequência para a auditoria: nenhum achado deve sugerir configurar,
otimizar ou migrar algo desta lista de ausências sem que o usuário peça. E
como não há suíte de testes, **toda refatoração sugerida corre sem rede** —
isso precisa entrar no cálculo de risco de cada finding.

---

## Regras

### Import de React por namespace

`import React from "react"` no topo, e hooks acessados como `React.useState`,
`React.useEffect`, `React.useId`. Import nomeado de hooks não é o padrão.

- **id:** `react-namespace`
- **fonte:** 18/18 arquivos de componente
- **viola quem:** usa `import { useState } from "react"`

### Merge de classes inline

`[...].filter(Boolean).join(" ")` direto no componente, ou um `cx()` **local
ao arquivo**. Não existe helper compartilhado, e não há dependência de `clsx`
nem `classnames`.

- **id:** `merge-classes`
- **fonte:** COMPONENT_GUIDELINES.md § Template + 14/18 arquivos com
  `filter(Boolean).join`, 8/18 com um `cx()` local
- **viola quem:** importa `clsx`/`classnames`, cria um `cx()` compartilhado, ou
  concatena classes por template string sem filtrar valores falsy

### Props estendem o elemento nativo, e `className` + `{...rest}` são repassados

```tsx
export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: { id: string; label: React.ReactNode; content: React.ReactNode }[];
}

export function Tabs({ items, className, ...rest }: TabsProps) {
  return <div className={["ms-tabs", className].filter(Boolean).join(" ")} {...rest} />;
}
```

Quando a prop própria colide com uma nativa, use `Omit` — precedente real:
`StepIndicatorProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange">`,
porque o `onChange` próprio tem assinatura `(index: number) => void`.

- **id:** `props-repassadas`
- **fonte:** COMPONENT_GUIDELINES.md § Template; 50 interfaces `*Props`, 33
  estendendo `React.*HTMLAttributes` ou `Omit<React.*>`; 15/18 arquivos com
  `...rest`
- **viola quem:** define props sem estender o elemento correspondente, ou não
  repassa `className`/`{...rest}` ao elemento raiz

### `interface` para props, sempre exportada

`export interface XProps`. Nenhuma ocorrência de `export type XProps` no repo.

- **id:** `props-interface`
- **fonte:** 50 `export interface *Props`, 0 `export type *Props`
- **viola quem:** tipa props com `type`, ou não exporta a interface

### `export function`, nunca `export const` com arrow

67 componentes declarados com `export function`; zero com
`export const X = () =>`. `React.forwardRef` (3 arquivos) usa função nomeada
por dentro: `forwardRef<T, P>(function Select(props, ref) { … })`.

- **id:** `declaracao-function`
- **fonte:** 67/67
- **viola quem:** declara componente como arrow atribuída a const

### Tokens antes de valores

Nenhum CSS novo escreve `15px` ou uma cor solta. Sempre `var(--token)`. Se um
componente parece exigir um token novo, isso é sinal de alerta, não permissão.

- **id:** `tokens-antes-de-valores`
- **fonte:** CLAUDE.md § Regras que não se negociam; TOKENS.md
- **viola quem:** introduz valor literal de cor, espaçamento, raio, duração ou
  sombra em `components.css`

### CSS com prefixo `ms-` e BEM

`.ms-tabs`, `.ms-tabs__item`, `.ms-tabs--pill`. Tudo escopado em `.ms-page`.

- **id:** `css-ms-bem`
- **fonte:** COMPONENT_GUIDELINES.md § Onde um componente novo entra
- **viola quem:** classe sem o prefixo, fora de BEM, ou seletor que escapa de
  `.ms-page`

### Sem reset global

`box-sizing` e zeragem de margem valem só dentro de `.ms-page`. Reset completo
é opt-in via `mothership-ds/reset.css`. Herança em vez de força bruta: cor e
fonte declaradas em `.ms-page` e herdadas; só controles nativos recebem
instrução explícita. Sem `!important`.

- **id:** `sem-reset-global`
- **fonte:** ARCHITECTURE.md § A biblioteca não invade o app
- **viola quem:** adiciona seletor fora de `.ms-page`, usa `.ms-page *`, ou
  recorre a `!important`

### IDs de SVG via `React.useId()`

Todo componente que referencia algo por `url(#…)` (máscara, gradiente, filtro)
gera o ID com `React.useId()` e sanitiza com `.replace(/[^a-zA-Z0-9_-]/g, "")`.
Contador de módulo (`let uid = 0`) quebra a hidratação — o servidor emite um
ID e o cliente calcula outro.

- **id:** `svg-useid`
- **fonte:** ARCHITECTURE.md § Armadilhas de hidratação; 9/18 arquivos usam
  `React.useId`
- **viola quem:** gera ID de SVG por contador, `Math.random()` ou string fixa

### `position: fixed` sempre em portal no `<body>`

Modal, StepModal, menu da navbar, toasts, histórico de alertas, tooltip,
popover, dropdown. Um ancestral com `transform`, `filter`, `backdrop-filter` ou
`will-change` vira o bloco de contenção dos descendentes fixos — e o sistema
usa `backdrop-filter` à vontade.

Exceção documentada: o popup de `Select`/`Combobox` é `position: absolute` num
wrapper relativo, deliberadamente, com o limite conhecido de cortar dentro de
ancestral com `overflow: hidden`.

- **id:** `fixed-em-portal`
- **fonte:** ARCHITECTURE.md § Portais; 7/18 arquivos usam `createPortal`
- **viola quem:** posiciona elemento flutuante com `fixed` sem portal

### Escala de z-index é fixa e documentada

`navbar-menu 99 · navbar 100 · drawer-backdrop 150 · drawer 151 ·
sidebar-toggle 152 · modal 500 · toasts 600 · histórico 610 ·
tooltip/popover/dropdown 700 · splash 1000`. Toasts ficam acima do modal de
propósito.

- **id:** `z-index-escala`
- **fonte:** ARCHITECTURE.md § Escala de z-index
- **viola quem:** introduz z-index fora da escala

### Estado nunca só por cor

Todo estado visual tem `aria-*` correspondente: `aria-expanded` (accordion,
hambúrguer), `aria-current` (etapa, breadcrumb, paginação), `aria-checked`
(`role="switch"`), `aria-sort` no `<th>`, `aria-selected` (listbox). Vale
também para conteúdo estático: recurso não incluído troca o ícone **e** risca
o texto — dois sinais redundantes, não só cor.

- **id:** `estado-com-aria`
- **fonte:** ACCESSIBILITY.md § Princípio geral
- **viola quem:** marca estado apenas por classe/cor

### Contrato de foco: modal prende, popover leve não

Modal e StepModal: foco entra ao abrir, Tab circula dentro, foco volta ao
gatilho ao fechar, `title` é o alvo de `aria-labelledby`. Popover, Drawer,
DropdownMenu e o popup de Select são "leves": clique fora e Esc fecham, Esc
devolve o foco ao gatilho, mas **não** prendem o foco — e por isso **não**
usam `role="dialog"`.

- **id:** `contrato-de-foco`
- **fonte:** ACCESSIBILITY.md § Modal; comentários em `popover.tsx`, `drawer.tsx`
- **viola quem:** cria overlay modal sem o contrato completo, ou marca overlay
  leve como `role="dialog"`

### Anel de foco herdado, nunca reinventado

O sistema define o próprio anel accent em `:focus-visible` (o do navegador some
sobre as superfícies de vidro). Um controle novo deve herdar esse anel sem CSS
extra; se não herdar, ele está fora do padrão — investigar, não estilizar à
parte. A regra global usa `:is(...)`, que carrega a especificidade do argumento
mais específico e vence regras locais: mexer em `border-color`/`box-shadow` no
`:focus` de um componente produz dois anéis concêntricos.

- **id:** `anel-de-foco-unico`
- **fonte:** ACCESSIBILITY.md § Foco; correção registrada em CLAUDE.md v1.3.0
- **viola quem:** define anel de foco próprio por componente

### Animação respeita `prefers-reduced-motion`

Tudo que anima tem comportamento definido sob `reduce`. Exceção deliberada: o
parallax do mouse no fundo permanece — é resposta direta a uma ação do
usuário, não animação ambiente.

- **id:** `reduced-motion`
- **fonte:** ACCESSIBILITY.md § Movimento
- **viola quem:** introduz animação sem bloco `@media (prefers-reduced-motion: reduce)`

### Componente novo entra em quatro lugares, sempre os quatro

1. CSS em `src/styles/components.css`
2. Componente em `src/components/` — arquivo novo só se a **área** for nova
3. Export em `src/index.ts`
4. Story em `styleguide/stories.tsx`

Pular qualquer um deixa o componente sem estilo, inacessível ou indocumentado.

- **id:** `quatro-lugares`
- **fonte:** COMPONENT_GUIDELINES.md
- **viola quem:** adiciona componente sem export no barrel raiz ou sem story

### Variação antes de componente novo

Se falta uma variação de algo que existe (`tone`, `variant`, `size`), estenda a
prop em vez de duplicar o componente. Precedente na direção oposta: `Container`
foi **removido** por ser wrapper fino sem consumidor real.

- **id:** `variacao-antes-de-novo`
- **fonte:** COMPONENT_GUIDELINES.md § Quando NÃO criar um componente novo
- **viola quem:** cria componente que é variação de um existente

### Idioma pt-br, comentário só para o porquê

Commits, docs e comentários em português, tom direto. Comentário só quando
explica um *porquê* não óbvio — o código já diz o *o quê*.

- **id:** `idioma-ptbr`
- **fonte:** CLAUDE.md § Idioma
- **viola quem:** comenta em inglês, ou comenta o óbvio

---

## Sem padrão estabelecido

Pontos onde o projeto não decidiu. A auditoria **não deve escolher um lado**
nem reportar inconsistência aqui.

- **`forwardRef`**: 3 de 18 arquivos usam. `Button`/`ButtonLink`/`IconButton`
  explicitamente **não** encaminham ref hoje — e o `Popover` contorna isso
  medindo o gatilho por um wrapper interno. É lacuna conhecida, não regra.
- **Granularidade de arquivo**: varia de 1 export (`Loader`, `drawer`) a 21
  (`primitives`). O critério é "área", que é qualitativo — não há limiar.
- **Nomenclatura de arquivo**: `PascalCase.tsx` para arquivo de um componente
  único (`Modal`, `Loader`, `Splash`, `LogoMark`, `StepIndicator`),
  minúsculo/kebab para arquivo de área (`primitives`, `dropdown-menu`,
  `charts`). São duas regras coerentes convivendo, não inconsistência — mas o
  limite entre "componente único" e "área" não está escrito.

---

## Declarado mas não praticado

**`"use client"` em `primitives.tsx`.** `CLAUDE.md` (§ Regras que não se
negociam) e `ARCHITECTURE.md` (§ Fronteira servidor/cliente) afirmam que
apenas dois arquivos ficam sem a diretiva: `primitives.tsx` e `LogoMark.tsx`.
Na extração, 17 dos 18 arquivos têm `"use client"` — o único sem é
`LogoMark.tsx`. `primitives.tsx` ganhou a diretiva em algum momento (provável
consequência dos lotes de `Checkbox`/`Radio`/`Switch`/`Pagination`) e a
documentação não acompanhou.

Não entra como regra: a doc está desatualizada, ou a diretiva foi adicionada
sem necessidade. Precisa de uma decisão humana antes de virar régua — e é
exatamente o tipo de coisa que só aparece quando se confronta documentação com
contagem real.

---

## Arquivos gerados — nunca auditar, nunca editar

- `src/components/LogoMark.tsx` — gerado a partir de `assets/logo.svg`.
  Mudanças na logo entram pelo SVG de origem.

---

## Princípios

Contexto para a auditoria, não critério de finding.

- **Minimalismo.** Prop, variante ou wrapper sem uso real e concreto hoje não
  entra.
- **Poucos efeitos, repetidos.** `backdrop-filter` + `--blur-glass` para
  superfícies; a coesão vem de reusar um punhado de efeitos, não de inventar
  um por componente.
- **Performance acima de complexidade.** CSS puro sempre que resolver; JS só
  quando CSS não alcança. Sem dependência de runtime nova.
- **Memoização não é reflexo.** 17 ocorrências de `useMemo`/`useCallback` em
  todo o repo, concentradas em `theme.tsx` e `Modal.tsx`. Há precedente
  explícito na direção contrária: em `Gallery`, `filtered`/`totalPages`/
  `visibleItems` são recalculados a cada render, com a justificativa "arrays
  pequenos, sem necessidade de `useMemo`". **A auditoria não deve apontar
  memoização ausente neste repo sem um custo medido.**
- **Validação é visual.** Dois temas, abaixo de 720px, `npm run typecheck`
  limpo. Não existe rede de testes — o risco de qualquer refatoração sugerida
  precisa refletir isso.

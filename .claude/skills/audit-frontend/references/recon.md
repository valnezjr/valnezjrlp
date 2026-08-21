# Recon

Primeira fase da auditoria. Roda uma vez, na orquestradora, e o resultado é
repassado pronto aos especialistas. Objetivo: nunca aplicar uma regra de
Next num Vite, nem uma regra de web num React Native.

## Passo 1 — inventário bruto

```bash
# escala do repo (exclui deps e artefatos)
find . -type d \( -name node_modules -o -name .git -o -name dist -o -name build \
  -o -name .next -o -name .expo -o -name coverage \) -prune -o \
  -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.jsx' -o -name '*.js' \) -print | wc -l

# raízes de pacote (detecta monorepo)
find . -name package.json -not -path '*/node_modules/*' -maxdepth 4
```

Se aparecer mais de um `package.json`, é monorepo: leia o campo `workspaces`
(npm/yarn), `pnpm-workspace.yaml` ou `turbo.json`. **Audite por pacote**, com
findings carregando o caminho completo desde a raiz. Consolidar tudo num
balaio só produz um relatório ilegível.

## Passo 2 — framework

Ordem de checagem, primeira que bater vence:

| Sinal | Framework |
|---|---|
| `app/` com `layout.tsx` + dep `next` | `next-app` |
| `pages/_app.tsx` + dep `next` | `next-pages` |
| dep `expo` ou `app.json` com chave `expo` | `expo` |
| `android/` + `ios/` + dep `react-native`, sem `expo` | `rn-cli` |
| `vite.config.*` | `vite` |
| dep `react-scripts` | `cra` |
| nenhum acima | `desconhecido` → **pergunte, não assuma** |

Next com `app/` **e** `pages/` coexistindo é comum durante migração: marque
`next-app` e registre a coexistência — ela muda várias regras de bundle e de
data fetching, e é informação que o relatório precisa carregar.

Expo com `expo-router` e diretório `app/`: cuidado para não confundir com
Next App Router. A presença de `expo` no `package.json` decide.

## Passo 3 — linguagem e rigor

```bash
cat tsconfig.json 2>/dev/null
```

- Sem `tsconfig.json` → `linguagem: "js"`. Vários eixos rodam degradados;
  registre isso nos limites do relatório.
- `strict: true` → `ts`.
- `strict` ausente ou `false`, ou `strictNullChecks: false` → `ts-frouxo`.
  Isso muda a leitura de `any`: num projeto sem `strict`, apontar cada `any`
  é ruído — só as fronteiras contam.

Rode `npx tsc --noEmit` se houver `tsconfig`. Erros de tipo pré-existentes
são contexto essencial: num repo que já não compila limpo, "adicionar
tipagem" não é uma correção isolada.

## Passo 4 — build possível?

Procure o script de build em `package.json` (`build`, `build:web`, etc.).

- Existe e roda limpo → `podeBuildar: true`. `audit-bundle-deps` mede peso
  real.
- Existe e falha → `podeBuildar: false`, e o **motivo da falha vira finding
  crítico por si só**. Um projeto que não builda é o achado mais importante
  que a auditoria pode entregar.
- Não existe (biblioteca distribuída como fonte, por exemplo) → `podeBuildar:
  false`, sem finding. Registre como característica, não como defeito.

Nunca rode `npm install` sem perguntar. Se `node_modules` não existe, várias
ferramentas não rodam — degrade e declare.

## Passo 5 — entrypoints

O que o especialista precisa saber para calcular "proximidade de entrypoint":

| Framework | Entrypoints |
|---|---|
| `next-app` | `app/**/page.tsx`, `app/**/layout.tsx`, `app/**/template.tsx`, `middleware.ts` |
| `next-pages` | `pages/**/*.tsx` exceto `_document`, mais `_app.tsx` |
| `vite` / `cra` | `src/main.tsx` / `src/index.tsx`, mais as rotas do router |
| `expo` (expo-router) | `app/**/*.tsx` |
| `expo` / `rn-cli` (clássico) | `App.tsx`, mais as telas registradas no navigator |

Providers montados no topo (tema, auth, query client, store) contam como
entrypoint mesmo não sendo rota: tudo passa por eles.

## Passo 6 — estilização e estado

Não gera finding, mas evita achado falso. Detecte e repasse:

- **CSS**: Tailwind, CSS Modules, styled-components/emotion, CSS global,
  vanilla-extract. Um projeto com styled-components tem custo de runtime que
  um com Tailwind não tem — as regras de perf mudam.
- **Estado**: Redux, Zustand, Jotai, TanStack Query, SWR, Context puro. As
  regras de re-render dependem de qual.
- **Testes**: Vitest, Jest, Testing Library, Playwright, Cypress, ou nenhum.
- **Lint**: `eslint.config.*` ou `.eslintrc*`, e quais plugins já estão
  ligados. **Nunca reporte como achado algo que o ESLint do projeto já
  reporta** — isso é ruído duplicado; o dono já sabe.

## Saída

```jsonc
{
  "plataforma": "web",
  "framework": "next-app",
  "linguagem": "ts",
  "workspaces": null,
  "gerenciador": "pnpm",
  "podeBuildar": true,
  "escala": 284,
  "entrypoints": ["app/layout.tsx", "app/page.tsx", "app/dashboard/page.tsx"],
  "estilizacao": ["tailwind"],
  "estado": ["zustand", "tanstack-query"],
  "testes": [],
  "lint": { "config": "eslint.config.mjs", "plugins": ["next", "jsx-a11y"] },
  "coexistencia": null,
  "convencoes": ".audit/convencoes.md"
}
```

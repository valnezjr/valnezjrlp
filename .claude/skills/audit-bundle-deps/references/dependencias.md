# Dependências

Quando uma dependência é problema — e, mais importante, quando não é.

A tentação deste arquivo é transformar `npm outdated` em lista de findings.
Não faça isso. Versão defasada **não é achado**. O achado é a consequência
concreta da defasagem.

## Os seis problemas reais

### 1. Órfã — declarada e não usada

```bash
npx depcheck --json
```

Não pesa no bundle (nada a importa), mas custa tempo de `install`, ruído em
auditoria e a dúvida recorrente de "isso ainda é usado?".

`baixa`, esforço `baixo`, risco `baixo`. Confirme antes de reportar: `depcheck`
erra com deps usadas só em config (`tailwindcss`, `postcss`, plugins de ESLint,
tipos `@types/*`) e em scripts de CI.

### 2. Fantasma — usada e não declarada

O código importa algo que não está no `package.json`; funciona porque outra
dependência o instalou por transitividade e o gerenciador fez hoisting.

`alta`. Quebra sem aviso quando a dep intermediária troca de versão ou quando
o time migra para pnpm (que não faz hoisting plano). Cenário: nomeie o pacote,
o arquivo que importa e a dep transitiva que hoje o fornece.

### 3. Duplicada — duas versões da mesma lib

```bash
npm ls react
npm ls <suspeita>
npm dedupe --dry-run
```

Duas cópias no bundle é peso dobrado. Em alguns casos é bug, não só peso:

- **Duas cópias de React** → "Invalid hook call". `critica`.
- **Duas cópias de uma lib com contexto** (React Router, styled-components,
  react-i18next) → o provider de uma instância não é visto pelo consumidor da
  outra. Falha silenciosa e confusa. `alta`.
- **Duas versões de uma lib de utilidade** → só peso. `media`.

Correção: `overrides` (npm), `resolutions` (yarn) ou alinhar a versão do
dependente.

### 4. Abandonada

Critérios, todos verificáveis:

```bash
npm view <pacote> time.modified
npm view <pacote> deprecated
```

- Marcada como `deprecated` no registro → `alta`, sempre. O próprio autor está
  avisando.
- Sem release há 2+ anos **e** com issues abertas relevantes → `media`.
- Sem release há 2+ anos, estável, escopo fechado, funcionando → **não é
  finding**. Software pequeno e terminado existe.

Cenário precisa da consequência: incompatibilidade que já apareceu, feature
que o projeto precisa e não vem, ou peer dependency que impede atualizar
outra coisa.

### 5. Bloqueando outra atualização

O achado mais útil da família "versão". Uma dep presa numa versão antiga que
impede subir React, Next, TypeScript ou outra dep central.

```bash
npm outdated
npm ls --depth=1 | grep -i "UNMET\|invalid"
```

`alta` quando o bloqueio já está custando algo concreto (o time quis subir e
não conseguiu). `media` quando é potencial.

### 6. Peso desproporcional

Uma lib grande para um uso pequeno. Só é finding **com o KB medido** e com o
uso real levantado:

```bash
grep -rn "from ['\"]<pacote>" src | wc -l     # quantos arquivos usam
grep -rhoE "\{[^}]+\} from ['\"]<pacote>" src  # o que de fato é importado
```

Se três arquivos importam uma única função de uma lib de 200 KB, o cenário se
escreve sozinho.

## Padrões de import que desperdiçam

| Padrão | Problema | Correção |
|---|---|---|
| `import _ from "lodash"` | Sem tree-shaking (CommonJS) | `lodash-es` + import nomeado, ou `lodash/debounce` |
| `import * as X from "…"` | Impede eliminação seletiva | Import nomeado |
| `import { Icone } from "@mui/icons-material"` | Barrel com milhares de módulos | Import de caminho, ou `optimizePackageImports` |
| `import "moment/locale/pt-br"` + `moment` | Locales inteiros | `date-fns`, `dayjs` ou `Intl` |
| `import { algo } from "@/components"` (barrel próprio) | Arrasta a análise da pasta inteira | Import do arquivo direto |
| `require()` em código de app com bundler ESM | Bloqueia análise estática | `import` |

## Assets

Frequentemente o maior peso de um projeto front, e o mais fácil de confirmar:

```bash
find . -path ./node_modules -prune -o -type f \
  \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.gif' \
     -o -name '*.mp4' -o -name '*.woff' -o -name '*.woff2' -o -name '*.ttf' \) \
  -size +200k -exec du -h {} \; | sort -rh | head -20
```

- **Imagem acima de 500 KB servida crua** — `alta` se está no caminho inicial.
  Correção: `next/image`, `expo-image`, ou converter para WebP/AVIF.
- **GIF grande** — quase sempre deveria ser vídeo. Um GIF de 4 MB vira um MP4
  de 300 KB com a mesma aparência.
- **Fonte com todos os pesos** quando o CSS usa dois — cada peso é um arquivo.
- **`.ttf` em vez de `.woff2`** — 30–50% mais pesado sem ganho.
- **SVG de ícone como `<img>`** quando o projeto já tem um sistema de ícones:
  peso e requisição extras.

## Como escrever o finding

O cenário precisa de três coisas: **quanto**, **onde no caminho do usuário**, e
**qual o uso real**.

> `moment` (≈ 72 KB gzip, medido no chunk compartilhado) vem no First Load JS
> de todas as 14 rotas. Os 4 arquivos que o importam usam apenas `format` e
> `fromNow`; `date-fns` com import nomeado cobre os dois casos em ≈ 4 KB.

Sem os três, o leitor não tem como decidir se vale o trabalho — e um finding
que não permite decidir não deveria estar no relatório.

---
name: audit-bundle-deps
description: Audita peso de bundle e saúde de dependências em projetos React e React Native — imports que arrastam bibliotecas inteiras, ausência de code splitting, barrels que quebram tree-shaking, duplicação de dependência, pacotes órfãos, abandonados ou desatualizados, e assets não otimizados. Use quando o pedido for "o app está pesado", "demora pra carregar", "auditar as dependências", "reduzir o bundle", ou quando a skill audit-frontend delegar este eixo. Não usar para performance de renderização depois do carregamento (isso é audit-render-perf) nem para auditoria de vulnerabilidades de segurança.
---

# Audit Bundle & Deps

O custo de **chegar até o app**: o que o usuário baixa e o que o projeto
carrega junto sem precisar. Depois que o JS já rodou, o eixo é `audit-render-perf`.

## Entrada e saída

Recebe `stack`, `convencoes`, `arquivosPrioritarios`, `raiz`. Devolve **apenas**
um array JSON no formato de `audit-frontend/references/finding-format.md`.
Sem prosa, sem arquivo escrito.

## Este eixo tem dois modos

**Modo medido** (`stack.podeBuildar === true`): builda, mede, e cada finding
carrega números reais em KB. É o modo que produz achado acionável.

**Modo estático** (build ausente, quebrado, ou `node_modules` não instalado):
analisa imports e `package.json` sem números. Todos os findings saem com
`confianca: "baixa"` e **sem estimativa de KB inventada**. Escrever "≈ 300 KB"
sem ter medido é o pior erro possível neste eixo — o número vira verdade no
relatório e ninguém confere.

Nos dois casos o eixo entrega algo. Nunca pule silenciosamente: um eixo ausente
do relatório se lê como "está tudo bem por aqui".

Nunca rode `npm install` num repo alheio sem perguntar — muda lockfile e
dispara postinstall.

## Ordem de trabalho

### 1. Medir (modo medido)

Comandos por framework em [references/medicao.md](references/medicao.md).
Resumo:

| Stack | Como |
|---|---|
| Next | `@next/bundle-analyzer` com `ANALYZE=true next build`, ou a tabela de rotas que o próprio build imprime |
| Vite | `vite build` + `source-map-explorer 'dist/assets/*.js'` |
| CRA | `source-map-explorer 'build/static/js/*.js'` |
| Expo SDK 51+ | `EXPO_ATLAS=true npx expo export` |
| RN CLI | `react-native bundle` com `--sourcemap-output`, depois `source-map-explorer` |

A tabela de rotas do `next build` sozinha já vale muito: ela dá o First Load JS
por rota e o chunk compartilhado. Rota com First Load muito acima da mediana é
o primeiro lugar para olhar.

### 2. Higiene de dependências

```bash
npx depcheck --json          # declaradas e não usadas / usadas e não declaradas
npx knip --reporter json     # cruza com código morto
npm ls --depth=0             # o que está de fato instalado
npm outdated                 # defasagem
```

Duplicação de versão — a mesma lib em duas versões dentro de `node_modules` —
é achado frequente e caro:

```bash
npm ls <pacote>              # mostra a árvore e as versões conflitantes
npm dedupe --dry-run
```

Detalhe do que faz uma dependência ser um problema em
[references/dependencias.md](references/dependencias.md).

### 3. Imports

O que arrasta peso sem uso proporcional:

```bash
grep -rn "^import .* from ['\"]lodash['\"]" src            # lib inteira
grep -rn "from ['\"]moment['\"]" src                        # moment + locales
grep -rn "import \* as" src --include='*.ts' --include='*.tsx'
grep -rn "from ['\"]@mui/icons-material['\"]" src           # barrel de milhares de ícones
```

## Achados que quase sempre valem

1. **Biblioteca inteira importada para uma função.** `import _ from "lodash"`
   para usar `debounce`. Correção: `lodash-es` com import nomeado, ou
   `lodash/debounce`, ou 6 linhas próprias.
2. **Barrel de ícones.** `import { X } from "@mui/icons-material"` ou
   `lucide-react` sem tree-shaking configurado. Em Next, `optimizePackageImports`
   resolve sem mudar código.
3. **`moment` ainda presente.** Não recebe features desde 2020, arrasta locales
   por padrão e não faz tree-shaking. Migração para `date-fns` ou `Temporal`/
   `Intl` é o achado clássico de maior retorno em KB.
4. **Componente pesado no bundle inicial sem `dynamic`/`lazy`.** Editor de
   texto rico, gráfico, mapa, leitor de PDF, biblioteca de animação — carregados
   em rota onde só aparecem depois de um clique. **Cenário precisa do KB medido
   e de onde o componente aparece.**
5. **Duas bibliotecas para o mesmo trabalho.** `axios` + `fetch`, `date-fns` +
   `dayjs`, duas de animação, duas de formulário. `media`; o cenário é a
   duplicação de conhecimento no time, além do peso.
6. **Dependência declarada e não usada.** `depcheck`. Peso zero no bundle, mas
   custo de `install`, de auditoria e de confusão. `baixa`, esforço `baixo`.
7. **Dependência usada e não declarada.** Funciona por acaso, via hoisting de
   dependência transitiva. Quebra no dia em que a dep intermediária mudar.
   `alta`.
8. **Duplicação de versão.** Duas cópias de React, ou de uma lib grande, no
   mesmo bundle. `alta` — em React, é a causa clássica de "Invalid hook call".
9. **Assets não otimizados.** Imagem de 3 MB no repo, servida crua; fonte com
   todos os pesos importados quando só dois são usados; SVG que deveria ser
   componente vindo como `<img>` de arquivo grande.

## Anti-catálogo deste eixo

- Recomendar atualização de versão sem um problema concreto. "Está na v4, a
  v6 saiu" não é finding. Vira finding com: vulnerabilidade conhecida em uso,
  incompatibilidade com outra dep do projeto, ou abandono do pacote.
- Peso estimado sem medição. Se não mediu, diga que não mediu.
- Sugerir trocar uma dependência estável e bem usada por uma alternativa "mais
  leve" quando o peso não apareceu na medição.
- Reportar o tamanho de `node_modules`. Não vai para o bundle.
- Reportar peso de dependência de desenvolvimento.
- Sugerir microotimização de bytes (minificação, comentários) que o bundler já
  faz.
- Code splitting em app pequeno onde o bundle inteiro já é menor que o custo do
  round-trip extra.

## Interseções

- Componente pesado que também re-renderiza demais: o peso é seu, o render é
  de `render-perf`.
- Dependência não usada que também é código morto: o `knip` acha os dois. A
  dependência é sua; o arquivo morto é de `clean-code`.
- Fonte não otimizada que também causa salto de layout: o peso é seu; o
  deslocamento visual, se afeta legibilidade, é de `a11y`.

## Segurança

`npm audit` e análise de vulnerabilidade **não** fazem parte deste eixo — são
de `audit-seguranca`. A separação é de propósito: aqui uma dependência é
problema por **peso e higiene**; lá, por **risco**. Uma lib de 200 KB sem CVE é
achado seu; uma de 3 KB com CVE alcançável é achado dela.

Se algo com cara de vulnerabilidade aparecer no caminho, não reporte no seu
array — sinalize para que `audit-seguranca` confirme. Dependência não usada que
por acaso tem CVE: a remoção é sua, o risco é dela.

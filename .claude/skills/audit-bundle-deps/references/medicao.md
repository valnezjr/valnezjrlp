# Medição por stack

Sem medida, este eixo produz opinião. Com medida, produz uma lista ordenada
por KB — que é a única ordenação que importa aqui.

Regra: **todo número no relatório veio de um comando que você rodou.** Se o
comando falhou, o finding sai sem número e com `confianca: "baixa"`.

## Next.js

### O build já mede

`next build` imprime, sem nenhuma configuração, a tabela mais útil:

```
Route (app)                    Size     First Load JS
┌ ○ /                          5.2 kB          98.4 kB
├ ○ /dashboard                 142 kB           235 kB     ← olhe aqui
└ ○ /config                    3.1 kB          96.3 kB
+ First Load JS shared by all  93.2 kB
```

O que ler:

- **Shared by all** — todo mundo paga. Acima de ~150 KB pede investigação.
- **Rota muito acima da mediana** — algo grande está no caminho inicial dela.
- **`ƒ` (dinâmica) vs `○` (estática)** — rota que deveria ser estática mas
  virou dinâmica costuma ser um `cookies()`/`headers()` esquecido; é achado de
  performance de servidor, fora deste eixo, mas vale como observação.

### Analisador detalhado

```bash
npm i -D @next/bundle-analyzer     # peça antes de instalar
```

```js
// next.config.js
const analisar = require("@next/bundle-analyzer")({ enabled: process.env.ANALYZE === "true" });
module.exports = analisar(configExistente);
```

```bash
ANALYZE=true npx next build
```

Abre um treemap por chunk. Alternativa sem instalar nada, se houver
source maps no build:

```bash
npx source-map-explorer '.next/static/chunks/*.js' --json > /tmp/mapa.json
```

### Ajustes de Next que costumam ser o achado

- **`optimizePackageImports`** — resolve barrel de ícones e de UI sem tocar em
  nenhum import do código:

  ```js
  experimental: { optimizePackageImports: ["lucide-react", "date-fns", "@mui/material"] }
  ```

- **`next/dynamic` com `ssr: false`** para componentes que só existem no
  cliente (editor, mapa, gráfico).
- **`next/font`** em vez de `<link>` para Google Fonts: elimina round-trip e
  o salto de layout.
- **`next/image`** para imagem grande servida crua.

## Vite

```bash
npx vite build
npx source-map-explorer 'dist/assets/*.js' --json
```

Exige source maps:

```js
// vite.config.ts
build: { sourcemap: true }
```

Alternativa visual: `npx vite-bundle-visualizer`.

O aviso `(!) Some chunks are larger than 500 kB after minification` que o Vite
imprime sozinho já é ponto de partida — mas o número dele é **antes** do gzip.
Reporte sempre o valor gzip, e diga que é gzip.

Achados típicos de Vite:

- Rota sem `React.lazy` — em SPA, tudo vira um chunk só por padrão.
- `manualChunks` ausente com vendor grande misturado ao código da aplicação:
  qualquer deploy invalida o cache do vendor inteiro.

## CRA

```bash
npx source-map-explorer 'build/static/js/*.js' --json
```

CRA não recebe mais atualizações. **Isso por si só é observação, não finding**
— a menos que o projeto esteja travado numa versão de dependência por causa
do `react-scripts`, e aí o cenário é o travamento concreto.

## React Native — Expo (SDK 51+)

```bash
EXPO_ATLAS=true npx expo export
npx expo-atlas          # abre a UI de exploração do bundle
```

Sem Atlas (SDK mais antigo):

```bash
npx expo export --dump-sourcemap
npx source-map-explorer dist/bundles/*.js dist/bundles/*.map --json
```

## React Native — CLI

```bash
npx react-native bundle \
  --platform android --dev false --entry-file index.js \
  --bundle-output /tmp/rn.bundle --sourcemap-output /tmp/rn.map

npx source-map-explorer /tmp/rn.bundle /tmp/rn.map --json
```

Demora e exige o projeto instalado. Se falhar, vá para o modo estático.

O que é próprio de RN:

- **Tamanho do bundle JS importa menos que na web** (vem embutido no app, não
  baixado a cada visita) — mas importa para tempo de parse na abertura e para
  o peso de updates OTA (Expo Updates, CodePush).
- **Peso do APK/IPA** é outro assunto: assets, libs nativas, arquiteturas.
  Se relevante, `npx react-native-bundle-visualizer` ou análise do APK. Reporte
  como observação — está na borda deste eixo.
- **Fontes e imagens empacotadas**: uma pasta `assets/` com PNGs de 2 MB entra
  no app inteiro, em todas as densidades.

## Sem build possível — modo estático

O que ainda dá para afirmar sem medir:

1. **Imports de lib inteira** (`import _ from "lodash"`) — o padrão é
   verificável no código, o KB não.
2. **Dependências no `package.json`** que sabidamente são grandes e sem
   tree-shaking (`moment`, `lodash` não-es, `@mui/icons-material` via barrel).
   Cite o padrão, não o número.
3. **Ausência de `lazy`/`dynamic`** em rotas — verificável lendo o router.
4. **`depcheck` e `knip`** rodam sem build, desde que `node_modules` exista.
5. **Assets grandes no repo:**

   ```bash
   find . -path ./node_modules -prune -o -type f \
     \( -name '*.png' -o -name '*.jpg' -o -name '*.gif' -o -name '*.mp4' -o -name '*.woff*' \) \
     -size +300k -print -exec du -h {} \;
   ```

   Este último dá número real sem build nenhum — é o achado mais sólido
   disponível no modo estático.

Todos os findings deste modo levam, no `cenario`, a frase de que o peso não foi
medido e por quê.

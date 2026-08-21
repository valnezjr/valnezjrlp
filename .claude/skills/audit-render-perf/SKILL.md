---
name: audit-render-perf
description: Audita performance de renderização em React e React Native — re-renders em cascata, contexto mal fatiado, memoização ausente ou desnecessária, keys instáveis, listas sem virtualização, efeitos com dependências erradas, animações na thread errada. Use quando o pedido for "esse app está lento", "tem re-render demais", "auditar performance do front", ou quando a skill audit-frontend delegar este eixo. Não usar para peso de bundle e tempo de carregamento (isso é audit-bundle-deps), nem para performance de servidor ou de query.
---

# Audit Render Perf

Performance **de renderização**: o que acontece depois que o JS já carregou.
Peso de bundle, code splitting e tempo até a primeira pintura são de
`audit-bundle-deps` — se um achado é sobre "o app demora a abrir", ele é de lá.

## Entrada e saída

Recebe da orquestradora: `stack`, `convencoes`, `arquivosPrioritarios`, `raiz`.
Devolve **apenas** um array JSON no formato de `audit-frontend/references/finding-format.md`.
Sem prosa, sem arquivo escrito, sem relatório próprio.

Rodando sozinha (pedido direto do usuário), faça um recon mínimo primeiro:
framework, plataforma e biblioteca de estado — as regras mudam com os três.

## Ordem de trabalho

### 1. Ferramentas primeiro

```bash
npx eslint --no-eslintrc --plugin react-hooks \
  --parser-options=ecmaVersion:latest,sourceType:module,ecmaFeatures:{jsx:true} \
  --rule '{"react-hooks/rules-of-hooks":"error","react-hooks/exhaustive-deps":"warn"}' \
  'src/**/*.{js,jsx,ts,tsx}' --format json
```

Se o projeto já tem `react-hooks` no ESLint dele, **leia a saída do lint do
projeto em vez de rodar de novo**. Reportar o que o lint do time já reporta
enche o relatório de coisa que o dono já viu e ignorou por escolha.

Projeto com React Compiler ligado (`babel-plugin-react-compiler` ou
`experimental.reactCompiler` no Next): boa parte dos achados de memoização
manual deixa de valer. Confirme antes de escrever qualquer finding de
`useMemo`/`useCallback` ausente — nesse caso o compilador já resolve, e o
achado real passa a ser o oposto: memoização manual redundante e o que
**impede** o compilador de otimizar (mutação durante o render, refs lidas no
corpo do componente, condicionais em hooks).

### 2. Mapear o que dispara render

Antes de olhar componente por componente, monte o mapa de origens de render:

- **Providers de contexto** montados nos entrypoints — para cada um, quantos
  consumidores e com que frequência o value muda.
- **Stores** (Redux/Zustand/Jotai) — seletores que devolvem objeto ou array
  novo a cada chamada.
- **Estado de alta frequência** — input controlado, scroll, mousemove, timer.
  Onde ele mora determina o tamanho da cascata.

Quase todo problema sério de render neste eixo é uma dessas três coisas
morando alto demais na árvore. Um `useCallback` faltando numa folha é ruído
em comparação.

### 3. Leitura dirigida

Só os `arquivosPrioritarios`. Para cada um, o catálogo da plataforma:

- Web (React DOM, Next, Vite, CRA): [references/web.md](references/web.md)
- React Native (Expo ou CLI): [references/react-native.md](references/react-native.md)

## O que só conta como finding com número

Este eixo é o que mais atrai achado hipotético. Três exigências:

**Cascata precisa de contagem.** "Re-renderiza vários componentes" não é
achado. Conte os consumidores do contexto, ou os filhos do componente que
re-renderiza. O número entra no `cenario`.

**Lista precisa do tamanho real.** Uma `map` sobre um array não é problema.
Vá atrás de quantos itens aquele array tem na prática — na fixture, no mock,
no tipo de retorno da API, no comentário do código. Se não der para saber,
escreva "tamanho desconhecido" no cenário e use `confianca: "media"`. Nunca
invente "pode ter milhares".

**Custo precisa ser plausível.** `useMemo` numa soma de 5 números custa mais
do que economiza. Antes de sugerir memoização, verifique que o cálculo é caro
(ordenação, filtro sobre lista grande, parse, `new Date` em loop) **ou** que o
resultado é passado como prop para um componente memoizado.

## Anti-catálogo deste eixo

Não são findings:

- `useCallback`/`useMemo` ausente em componente que não é memoizado e cujo
  filho também não é. Sem `React.memo` na ponta, a memoização não muda nada.
- Função inline em prop de elemento DOM nativo (`<button onClick={() => …}>`).
  Custa uma alocação; não causa re-render de nada.
- Componente que re-renderiza mas cujo output é idêntico e barato. React
  reconciliar uma folha simples é da ordem de microssegundos.
- "Falta virtualizar" numa lista de 20 itens.
- Uso de `index` como key numa lista que nunca reordena, nunca filtra e cujos
  itens não têm estado próprio.
- `React.memo` ausente como recomendação genérica. `memo` em componente com
  props que mudam sempre é custo puro de comparação.

Todo item acima **vira** finding se vier acompanhado de um cenário concreto
que o transforme em problema real. A regra não é "nunca aponte isso" — é
"não aponte isso sem o cenário".

## Achados que quase sempre valem

Em ordem aproximada de retorno:

1. **Value de contexto sem identidade estável** — objeto literal em `value`.
   Um `useMemo` de uma linha corta cascata em dezenas de componentes.
2. **Contexto único fazendo trabalho de dois** — dado que muda muito e dado
   que nunca muda no mesmo provider. Separar em dois contextos é barato.
3. **Estado de alta frequência alto demais** — o valor do input controlado
   morando no componente de página em vez de no formulário.
4. **Seletor de store que devolve objeto novo** — `useStore(s => ({a: s.a, b: s.b}))`
   sem comparador raso. Re-render em toda mudança do store inteiro.
5. **Efeito que roda a cada render** — dependência que é objeto/array/função
   recriado no corpo do componente.
6. **Vazamento**: listener, `setInterval`, `IntersectionObserver`,
   subscription sem cleanup. Isso é `critica`, não `alta` — acumula.
7. **Key instável** — `key={Math.random()}`, `key={index}` em lista que
   reordena/filtra. Desmonta e remonta a subárvore, perde estado e refaz
   animação de entrada.
8. **Trabalho pesado no corpo do componente** — ordenação, `JSON.parse`,
   `new Intl.NumberFormat` recriado a cada render.

## Interseções com outros eixos

- Componente enorme que re-renderiza inteiro: o achado de render é o
  re-render; o de tamanho/responsabilidade é de `clean-code`. Reporte só o
  seu — a consolidação junta os dois.
- Biblioteca pesada importada dentro de um componente quente: peso é
  `bundle-deps`; se o custo é de execução a cada render, é seu.
- Animação que ignora `prefers-reduced-motion`: é `a11y`, não seu, mesmo que
  a animação também custe frames.

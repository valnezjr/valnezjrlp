---
name: audit-a11y
description: Audita acessibilidade e semântica em projetos React e React Native — elementos interativos inalcançáveis por teclado, foco invisível ou perdido, estado marcado só por cor, rótulos ausentes, contraste insuficiente, overlays sem contrato de foco, animação sem respeito a prefers-reduced-motion, e no React Native props de acessibilidade e alvos de toque. Use quando o pedido for "auditar acessibilidade", "isso é acessível?", "revisar a11y", "adequar a WCAG", ou quando a skill audit-frontend delegar este eixo. Não usar para peso de bundle nem performance de render.
---

# Audit A11y

Acessibilidade e semântica. O eixo com a maior distância entre "a ferramenta
passou" e "uma pessoa consegue usar".

## A regra que abre este arquivo

**axe cobre cerca de um terço dos critérios de WCAG.** Ele não testa ordem de
foco, qualidade de rótulo, se a navegação por teclado faz sentido, nem se um
`aria-label` descreve o que o controle realmente faz.

Nunca escreva, em nenhuma forma, que "a acessibilidade está ok" porque as
ferramentas passaram. O relatório declara o que foi verificado
automaticamente e o que exigiria teste com pessoa e leitor de tela.

## Entrada e saída

Recebe `stack`, `convencoes`, `arquivosPrioritarios`, `raiz`. Devolve **apenas**
um array JSON no formato de `audit-frontend/references/finding-format.md`.
Sem prosa, sem arquivo escrito.

## Ordem de trabalho

### 1. Lint

```bash
# web
npx eslint --no-eslintrc --plugin jsx-a11y \
  --parser-options=ecmaVersion:latest,sourceType:module,ecmaFeatures:{jsx:true} \
  --rule '{"jsx-a11y/alt-text":"error","jsx-a11y/anchor-is-valid":"error","jsx-a11y/click-events-have-key-events":"error","jsx-a11y/no-static-element-interactions":"error","jsx-a11y/label-has-associated-control":"error","jsx-a11y/aria-props":"error","jsx-a11y/role-has-required-aria-props":"error","jsx-a11y/no-autofocus":"warn"}' \
  'src/**/*.{jsx,tsx}' --format json

# react native
npx eslint --no-eslintrc --plugin react-native-a11y \
  --rule '{"react-native-a11y/has-accessibility-hint":"warn","react-native-a11y/has-valid-accessibility-role":"error","react-native-a11y/no-nested-touchables":"error"}' \
  'src/**/*.{jsx,tsx}' --format json
```

Se o projeto já tem `jsx-a11y` ligado, leia a saída do lint dele em vez de
rodar de novo.

### 2. axe nas rotas principais (só web, só com build/dev possível)

Script em `audit-frontend/references/ferramentas.md` § axe. Rode nos
entrypoints principais, nos dois temas se o projeto tiver tema.

Sem servidor possível, pule e declare — não invente resultado de axe.

### 3. Leitura dirigida

- Web: [references/web.md](references/web.md)
- React Native: [references/react-native.md](references/react-native.md)

## As quatro perguntas por componente interativo

Aplicadas a cada componente interativo dos `arquivosPrioritarios`. Elas cobrem
o grosso do que axe não pega:

1. **Dá para chegar nele com Tab?** Elemento não-nativo com handler de clique
   precisa de `tabIndex`, `role` e handler de teclado — ou, muito melhor, do
   elemento nativo certo.
2. **Dá para ver que ele está focado?** `outline: none` sem substituto é o
   achado mais comum e mais grave desta lista.
3. **O leitor de tela sabe o que ele é, o que faz e em que estado está?**
   Nome acessível + `role` + `aria-*` de estado.
4. **Se ele abre algo, o foco vai junto e volta?** Overlays: entra, fica preso
   enquanto aberto (se modal), volta ao gatilho ao fechar.

## Achados que quase sempre valem

Em ordem aproximada de gravidade:

1. **`<div onClick>` sem `role`, `tabIndex` e handler de teclado.** Não existe
   para quem não usa mouse. `critica` num fluxo principal.
2. **Foco invisível.** `outline: none` (ou `:focus { outline: none }`) sem
   `:focus-visible` substituto. `alta`; `critica` se atinge o app todo via
   reset global.
3. **Botão só de ícone sem nome acessível.** Sem `aria-label` ou texto visually
   hidden, o leitor anuncia "botão" e nada mais.
4. **Estado marcado só por cor.** Aberto/fechado, selecionado, ativo, com erro
   — sem `aria-expanded`, `aria-selected`, `aria-current`, `aria-invalid`.
   Falha para leitor de tela e para daltonismo.
5. **Overlay modal sem contrato de foco.** Abre e o foco fica atrás; Tab
   escapa para a página; ao fechar, o foco vai para o `<body>` e a pessoa volta
   ao topo do documento. `alta`.
6. **Input sem `<label>` associado.** `placeholder` não é rótulo — some ao
   digitar e muitos leitores não anunciam.
7. **Contraste abaixo de 4.5:1** em texto de corpo, ou 3:1 em texto grande e
   em componentes de interface. Meça, não estime.
8. **Imagem informativa sem `alt`**, ou imagem decorativa com `alt` descritivo
   (ruído). Os dois são finding, em direções opostas.
9. **Animação sem `prefers-reduced-motion`.** Parallax, auto-scroll, carrossel
   automático, transições longas. `media`; `alta` para movimento amplo e
   contínuo, que provoca enjoo de verdade.
10. **Ordem de foco que não segue a leitura.** Causada por `order` do
    flex/grid, `position: absolute` ou portal mal colocado. Só detectável
    lendo — nenhuma ferramenta pega.
11. **Conteúdo dinâmico que não é anunciado.** Toast, erro de formulário,
    resultado de busca sem região viva.

## Anti-catálogo deste eixo

- `aria-*` adicionado a elemento nativo que já tem a semântica.
  `<button role="button">` é redundante; `<nav role="navigation">` também.
- Exigir `alt` descritivo em imagem puramente decorativa. `alt=""` é a resposta
  certa ali.
- Exigir `aria-label` em elemento que já tem texto visível — o texto vira o
  nome acessível e o label o sobrescreve, muitas vezes para pior.
- Exigir landmark, skip link ou hierarquia de heading num componente isolado
  fora de página. Isso é responsabilidade da página.
- Reportar contraste "no olho". Sem cálculo, é observação.
- Exigir `accessibilityHint` em tudo no RN — hint é para o que não é óbvio;
  em tudo, vira ruído para quem usa VoiceOver o dia inteiro.
- Tratar cada instância do mesmo defeito como finding separado. 37 cards com
  o mesmo `<div onClick>` são **um** finding com 37 ocorrências — a correção
  é uma só.

## Contraste — como medir de verdade

Extraia as cores reais (tokens CSS, tema, `StyleSheet`) e calcule. Sem chute:

```js
// razão de contraste WCAG 2.x
const canal = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
const razao = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
```

Limites: **4.5:1** texto de corpo, **3:1** texto grande (≥ 24px, ou ≥ 19px em
negrito) e componentes de interface (bordas de input, ícones que carregam
informação).

Projeto com tema claro e escuro: **meça os dois separadamente**. Um par que
passa no escuro reprova no claro com frequência — e o inverso.

Cor sobre superfície translúcida (vidro, overlay) não tem cor final estática:
componha a cor resultante antes de medir, ou declare que a medição foi
aproximada e diga qual fundo você assumiu.

## Interseções

- Animação que ignora `prefers-reduced-motion` **e** custa frames: o
  `reduced-motion` é seu; o custo é de `render-perf`.
- `any` num handler que também apaga a tipagem de `aria-*`: é de `clean-code`.
- Fonte pesada que também causa salto de layout: o peso é de `bundle-deps`; se
  o salto move texto durante a leitura, o achado de leitura é seu.

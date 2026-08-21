# A11y — React Native

O modelo mental muda. Não existe DOM, não existe `outline`, não existe Tab.
O que existe é a árvore de acessibilidade que o RN entrega ao **TalkBack**
(Android) e ao **VoiceOver** (iOS), navegada por gestos de deslizar, não por
teclado.

Isso significa que os defeitos são outros — e que ferramenta automática cobre
ainda menos que na web. `eslint-plugin-react-native-a11y` pega uma fração;
o resto é leitura.

## As props que importam

| Prop | Para quê |
|---|---|
| `accessible` | Agrupa a subárvore num único elemento focável pelo leitor |
| `accessibilityLabel` | O nome anunciado |
| `accessibilityHint` | O que acontece ao ativar — só quando não é óbvio |
| `accessibilityRole` | `button`, `link`, `header`, `image`, `switch`, `search`… |
| `accessibilityState` | `{ disabled, selected, checked, busy, expanded }` |
| `accessibilityValue` | `{ min, max, now, text }` para slider e progresso |
| `accessibilityLiveRegion` (Android) / `AccessibilityInfo.announceForAccessibility` | Anunciar mudança dinâmica |
| `importantForAccessibility` (Android) / `accessibilityElementsHidden` (iOS) | Esconder o que é decorativo |

## Achados típicos

### Touchable sem rótulo

```tsx
<TouchableOpacity onPress={fechar}>
  <Icon name="x" />
</TouchableOpacity>
```

O leitor anuncia "botão" e nada mais — ou, pior, o nome do arquivo do ícone.
Precisa de `accessibilityLabel="Fechar"` e `accessibilityRole="button"`.

`alta`. Um finding para todas as ocorrências do mesmo padrão.

### `View` com `onPress` via `Pressable` sem role

Sem `accessibilityRole="button"`, o leitor não anuncia que é acionável. A
pessoa passa por cima sem saber que dá para tocar.

### Touchables aninhados

`Pressable` dentro de `Pressable` (card clicável com botão de favoritar
dentro). O leitor não consegue separar os dois alvos e o toque ambíguo vai
para o pai. Regra `no-nested-touchables`. `alta`.

Correção: `accessible={false}` no pai e alvos independentes, ou tirar o filho
de dentro.

### Agrupamento errado

```tsx
<View>                       {/* leitor anuncia 3 elementos separados */}
  <Text>Pedido #4821</Text>
  <Text>Entregue</Text>
  <Text>R$ 149,90</Text>
</View>

<View accessible accessibilityLabel="Pedido 4821, entregue, 149 reais e 90 centavos">
```

Navegar por um card de 6 textos soltos, item a item, é exaustivo. Agrupar é a
diferença entre uma lista usável e uma lista que ninguém termina.

Mas o inverso também é finding: agrupar um card que contém um botão faz o
botão desaparecer da navegação.

### Estado só visual

Chip selecionado que só muda de cor, sem
`accessibilityState={{ selected: true }}`. Aba ativa, switch, checkbox
customizado, item de lista escolhido — todos precisam do estado.

`alta`, mesma razão da web: falha para leitor e para daltonismo.

### Alvo de toque pequeno

Mínimo recomendado: **44×44 pt (iOS)** / **48×48 dp (Android)**.

```bash
grep -rn "width: *[12][0-9]\b.*height: *[12][0-9]\b" src   # ponto de partida, não prova
```

Ícone de 24px sem `hitSlop` nem padding é finding `media`. `hitSlop` resolve
sem mudar o visual:

```tsx
<Pressable hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
```

### Imagem sem descrição

`<Image>` informativa sem `accessibilityLabel` e sem `accessible`. Imagem
decorativa precisa do oposto: `accessible={false}` ou
`importantForAccessibility="no"` (Android) — senão o leitor para nela sem ter
nada a dizer.

### Texto que não escala

RN não escala texto com a fonte do sistema por padrão em todos os casos, e
muitos projetos desligam de propósito para não quebrar layout:

```bash
grep -rn "allowFontScaling={false}\|maxFontSizeMultiplier" src
```

`allowFontScaling={false}` global é `alta` — anula o principal recurso de
baixa visão do sistema. `maxFontSizeMultiplier` com valor razoável (1.5–2) é
compromisso aceitável e não é finding.

O achado relacionado, e mais comum: layout com altura fixa em pontos que corta
o texto quando a fonte do sistema está grande. Verifique containers com
`height` fixo contendo `<Text>`.

### Contraste

Mesmos limites da web (4.5:1 corpo, 3:1 grande e interface). Extraia as cores
dos `StyleSheet` e do tema e calcule — no RN não há DevTools para medir por
cima.

Atenção a texto sobre imagem em card, e a placeholder de `TextInput`, que no
RN costuma vir num cinza ainda mais claro que na web.

### Anúncio de mudança dinâmica

Toast, erro de formulário, resultado de busca. No RN não existe `aria-live`
universal:

- Android: `accessibilityLiveRegion="polite"` no container.
- iOS: `AccessibilityInfo.announceForAccessibility("mensagem")`.

Projeto que mostra erro de formulário só visualmente é `alta` — a pessoa toca
em "Enviar", nada é anunciado, e não há como saber o que houve.

### Movimento

`AccessibilityInfo.isReduceMotionEnabled()` e o listener
`reduceMotionChanged`. Animação ambiente, parallax e auto-scroll precisam
respeitá-lo, igual à web. Reanimated tem `ReducedMotionConfig`.

Projeto com animações e nenhuma consulta a `isReduceMotionEnabled` é `media`,
um finding só.

### Ordem de leitura

O leitor segue a ordem da árvore, não a visual. `position: absolute`,
`flexDirection: "row-reverse"` e elementos sobrepostos podem produzir uma
ordem que não bate com o que se vê. Só detectável lendo o layout — nenhuma
ferramenta pega.

## Modal e overlay

`<Modal>` do RN não implementa foco preso sozinho. Verifique:

- `accessibilityViewIsModal={true}` (iOS) — sem isso, o leitor continua
  alcançando o conteúdo atrás.
- `importantForAccessibility="no-hide-descendants"` no conteúdo de fundo
  (Android).
- Foco movido para o título ao abrir
  (`AccessibilityInfo.setAccessibilityFocus(reactTag)`).
- Botão de fechar com rótulo, e gesto de voltar do Android funcionando.

Overlay customizado feito com `View` absoluta em vez de `<Modal>` quase nunca
tem nada disso. `alta`.

## Não são findings

- `accessibilityHint` ausente em botão cujo rótulo já diz tudo. Hint em tudo
  vira ruído para quem usa o leitor o dia inteiro.
- `accessibilityRole` em componente puramente decorativo.
- Exigir `accessibilityLabel` em `<Text>` que já tem o texto visível — o
  conteúdo já é o nome acessível, e o label o sobrescreve.
- Exigir suporte a teclado externo. Vale para tablet e acessibilidade motora,
  mas é escopo próprio, não item de auditoria geral.
- Sugerir uma biblioteca de acessibilidade sem um problema concreto.

## Como verificar de verdade

Se houver como rodar o app, isto vale mais que qualquer leitura de código —
mencione no relatório como próximo passo:

- **iOS**: Ajustes → Acessibilidade → VoiceOver, e o Accessibility Inspector
  do Xcode.
- **Android**: Configurações → Acessibilidade → TalkBack, e o Accessibility
  Scanner (app do Google Play, que verifica alvo de toque e contraste na tela
  real).

O relatório deve dizer que a auditoria foi por leitura de código e que a
verificação com leitor de tela real não foi feita — porque não foi.

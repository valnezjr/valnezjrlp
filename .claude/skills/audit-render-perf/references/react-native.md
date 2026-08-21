# Render perf — React Native (Expo e CLI)

Tudo do catálogo web sobre contexto, estado, efeitos, keys e componentes vale
igual aqui — a reconciliação é a mesma. Este arquivo cobre o que é próprio do
RN, onde o custo tem uma natureza diferente: a ponte entre JS e nativo, e a
distinção entre a thread de JS e a de UI.

## O eixo que não existe na web: qual thread faz o trabalho

Um app RN tem duas threads que importam para render:

- **JS** — React, lógica, `setState`. Se ela travar, a UI congela.
- **UI (nativa)** — layout e desenho. Animações que rodam aqui continuam
  fluidas mesmo com a thread de JS ocupada.

A maioria dos achados graves de perf em RN é trabalho que está na thread
errada. Sempre pergunte: isso precisa de JS a cada frame?

## Listas

### `ScrollView` com `.map()` no lugar de `FlatList`

O erro mais caro e mais comum do RN. `ScrollView` monta **todos** os filhos de
uma vez; `FlatList`/`FlashList` monta uma janela.

```tsx
<ScrollView>{itens.map((i) => <Card key={i.id} {...i} />)}</ScrollView>
```

Severidade `alta` a partir de ~40 itens com nó não trivial; `critica` acima de
~200, ou quando cada item carrega imagem remota. **Cenário precisa do tamanho
real da lista.**

Exceção legítima: lista curta e fixa (menu de 6 opções). Não é finding.

### `FlatList` sem as props que a fazem valer

| Prop | Por quê |
|---|---|
| `keyExtractor` | Sem ela, RN cai no index — mesmos problemas de key da web |
| `getItemLayout` | Só para itens de altura fixa; elimina a medição e conserta `scrollToIndex` |
| `removeClippedSubviews` | Android, listas longas |
| `initialNumToRender` | Padrão 10; ajustar ao que cabe na tela evita render fora de vista |
| `windowSize` | Padrão 21 telas de buffer — alto demais para item pesado |

Ausência de `keyExtractor` é finding. As demais só viram finding com lista
comprovadamente grande — sugerir tuning de janela numa lista de 15 itens é
ruído.

### `renderItem` recriando componente ou closure pesada

```tsx
renderItem={({ item }) => <Card {...item} onPress={() => abrir(item.id)} />}
```

`onPress` novo por item a cada render da lista; se `Card` é `memo`, a
memoização nunca acerta. A correção é `useCallback` no `renderItem` **e**
`onPress` estável dentro do item (passar `item.id` e o handler estável, não uma
closure nova).

Este é o caso em que memoização quase sempre vale em RN, ao contrário da web:
o custo por item é maior e as listas são a tela principal.

### Item de lista com `inline style` objeto

```tsx
<View style={{ padding: 16, backgroundColor: cor }}>   // objeto novo por item por render
<View style={[estilos.item, { backgroundColor: cor }]}>  // parte estática compartilhada
```

Em lista longa, isso é alocação × itens × renders. `eslint-plugin-react-native`
tem a regra `no-inline-styles` — rode antes de ler.

## Animação

### `Animated` sem `useNativeDriver: true`

Sem o driver nativo, cada frame passa pela thread de JS. Qualquer trabalho de
JS concorrente derruba a animação.

```tsx
Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true })
```

Nem toda propriedade suporta o driver nativo (`width`, `height`, `padding`,
`backgroundColor` não; `transform` e `opacity` sim). Animar `width` é finding
de `media`: sugira `transform: [{ scaleX }]` quando o efeito visual permitir.

### Reanimated com trabalho fora do worklet

Reanimated existe para rodar na thread de UI. Uma `useAnimatedStyle` que
chama uma função JS comum, ou um `runOnJS` a cada frame, anula o benefício.

**Confirmar:** procure `runOnJS` dentro de `useAnimatedScrollHandler`,
`useAnimatedGestureHandler` ou `useAnimatedStyle`. `runOnJS` num evento
discreto (fim do gesto) é correto; a cada frame, não.

### `LayoutAnimation` no Android sem a flag

Precisa de `UIManager.setLayoutAnimationEnabledExperimental(true)`. Sem isso,
não anima no Android e o código passa a impressão de estar funcionando porque
funciona no iOS.

## Navegação

### Todas as telas montadas ao mesmo tempo

React Navigation mantém telas anteriores montadas por padrão em stack. Uma
tela pesada que continua montada segue re-renderizando com o contexto acima.

- `React.memo` na tela + `useIsFocused` para pausar trabalho quando fora de foco.
- `detachInactiveScreens` / `react-native-screens` habilitado (padrão em versões
  recentes — confirme antes de reportar como ausente).
- Timer, polling ou animação que continua rodando em tela sem foco é `alta`.

### Props de navegação recriadas

Passar objeto grande via `navigation.navigate("Tela", { objetoInteiro })`
serializa a cada navegação e mantém a referência viva. Passe o id e busque no
destino.

## Imagens

- `<Image>` remoto sem `width`/`height` definidos força layout depois do
  download e causa salto visual.
- Ausência de `resizeMode` explícito em imagem de tamanho variável.
- Imagem grande (2000px) renderizada em 80px: memória de decodificação é
  proporcional ao original, não ao exibido. Em lista, isso derruba o app.
  `critica` quando acontece dentro de `FlatList`.
- `expo-image` ou `react-native-fast-image` resolvem cache e decodificação
  melhor que o `Image` nativo em lista longa — mas isso é sugestão de
  correção, não achado por si só.

## Ponte e módulos nativos

- Chamada de módulo nativo dentro do corpo do componente ou num efeito sem
  dependências corretas: cada render cruza a ponte.
- `AsyncStorage` lido de forma síncrona no caminho de render (não existe API
  síncrona — se o código espera, ele está bloqueando com estado intermediário).
- `console.log` em código de produção: em RN, cada log cruza a ponte para o
  debugger. Em loop ou lista, é custo real, não só sujeira. Este é o único
  caso em que `console.log` é finding de performance e não de limpeza.

## Específico de Expo

- `expo-av` ou câmera montados fora da tela ativa continuam consumindo.
- `expo-updates` verificando update no caminho crítico de abertura.
- Fontes carregadas com `useFonts` sem splash controlada: a tela pisca sem
  fonte antes de assentar.

## O que não é finding em RN

- `StyleSheet.create` vs. objeto literal fora do componente: a diferença
  prática hoje é desprezível.
- Ausência de `shouldComponentUpdate` — API de classe, o projeto usa hooks.
- Sugerir Hermes: já é o padrão. Só é finding se estiver explicitamente
  desligado, e aí é `alta`.
- Sugerir a Nova Arquitetura (Fabric/TurboModules) como item de auditoria.
  Migração de arquitetura é decisão de projeto, não achado — se for relevante,
  entra como observação.

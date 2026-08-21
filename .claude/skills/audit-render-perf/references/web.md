# Render perf — web (React DOM, Next, Vite, CRA)

Catálogo de leitura. Cada item traz o padrão, como confirmar e o que precisa
entrar no `cenario` para virar finding.

## Contexto

### Value com identidade nova a cada render

```tsx
<Ctx.Provider value={{ user, setUser }}>        // ← literal
<Ctx.Provider value={useMemo(() => ({ user, setUser }), [user])}>  // ← estável
```

**Confirmar:** conte os `useContext(Ctx)` no repo (`grep -rn "useContext(Ctx"`)
e veja com que frequência o provider re-renderiza (que estado ele tem acima ou
dentro). **Cenário precisa do número de consumidores.**

Severidade: `alta` com 10+ consumidores; `media` abaixo disso.

### Um contexto para dados de velocidades diferentes

Provider que carrega ao mesmo tempo algo que muda a cada tecla e algo que
muda uma vez por sessão. Todo consumidor do segundo paga pelo primeiro.

**Cenário:** nomeie os dois dados e a frequência de cada um.

### Contexto usado como store global

Contexto não tem seletor: quem consome, consome tudo. Um contexto com 8
campos onde cada consumidor usa um só é um store mal escolhido, não um
contexto mal escrito. Isso é achado de arquitetura com `eixo: "render-perf"` e
`esforco: "alto"` — a correção é trocar por Zustand/Jotai ou fatiar em vários
contextos, não um ajuste local.

## Estado

### Alto demais na árvore

Input controlado cujo estado mora na página, não no formulário. Cada tecla
re-renderiza a página inteira.

**Confirmar:** siga o `useState` até o componente que o declara e conte o que
existe abaixo dele. **Cenário:** "digitar uma letra em X re-renderiza N
componentes, incluindo Y e Z".

### Derivado guardado em estado

```tsx
const [filtrados, setFiltrados] = useState([]);
useEffect(() => setFiltrados(itens.filter(...)), [itens, busca]);  // ← dois renders
```

Um render para o efeito rodar, outro para o setState. Derivar direto no corpo
resolve com um render só. Severidade `media`, esforço `baixo`, risco `baixo` —
é dos melhores retornos que este eixo produz.

### Seletor de store devolvendo referência nova

```tsx
const { a, b } = useStore((s) => ({ a: s.a, b: s.b }));  // objeto novo sempre
const a = useStore((s) => s.a);                           // estável
```

Zustand sem `useShallow`, Redux `useSelector` sem `shallowEqual`, Jotai com
átomo derivado que recria objeto. **Confirmar:** procure `=> ({` dentro de
chamadas de seletor.

## Efeitos

### Dependência instável

Objeto, array ou função declarada no corpo do componente e usada como
dependência. O efeito roda a cada render. Se o efeito faz fetch, é request em
loop; se assina algo, é assinar/desassinar toda vez.

`exhaustive-deps` acha a maioria, mas não todos — ele avisa sobre dependência
*faltando*, não sobre dependência *instável*.

### Cleanup ausente

`addEventListener`, `setInterval`, `setTimeout` longo, `ResizeObserver`,
`IntersectionObserver`, `MutationObserver`, subscription de socket/store,
`AbortController` não abortado.

Severidade `critica` quando o componente monta e desmonta com frequência
(item de lista, conteúdo de modal, rota). **Cenário:** diga o que acumula e
em que ciclo de montagem.

### `useLayoutEffect` para trabalho não-layout

Bloqueia a pintura. Só vale para medir e ajustar DOM antes do frame. Fetch,
analytics ou log em `useLayoutEffect` é `media`.

## Listas

### Sem virtualização

Acima de ~100 itens **renderizados simultaneamente** e com nó por item não
trivial (card com imagem, linha de tabela com 8 colunas). Abaixo disso, o
custo do virtualizador supera o ganho.

**Cenário:** precisa do tamanho real da lista. Fonte aceitável: fixture, mock,
paginação da API, comentário no código, tipo com literal. Sem fonte,
`confianca: "media"` e diga que o tamanho não foi confirmado.

### Key instável

| Padrão | Consequência |
|---|---|
| `key={Math.random()}` / `key={uuid()}` no render | Remonta tudo a cada render. `critica`. |
| `key={index}` em lista que reordena, filtra ou pagina | Estado e animação colam na posição, não no item. |
| `key={index}` em lista estática sem estado por item | Não é finding. |

Precedente real de por que isso importa: uma galeria paginada onde a `key` era
a posição dentro da página fez o React reaproveitar os mesmos nós entre
páginas — a animação de entrada, que só dispara no mount, nunca mais rodou
depois da primeira página. O bug não era de performance, era visual, e a causa
era a key.

### Trabalho por item dentro do map

`new Intl.NumberFormat(...)`, `new Date(...)`, regex compilada, `.find()` numa
segunda lista. Multiplicado pelo número de itens e refeito a cada render.
Formatadores devem ser criados uma vez, fora do componente.

## Componentes

### Trabalho pesado no corpo

Ordenação, filtro sobre lista grande, `JSON.parse`, cálculo O(n²). Roda a cada
render, inclusive nos renders em que nada relevante mudou.

**Antes de sugerir `useMemo`:** confirme que o componente de fato re-renderiza
com frequência. Memoizar um cálculo caro num componente que renderiza uma vez
por navegação não ganha nada e adiciona uma dependência para manter correta.

### `React.memo` mal aplicado

- `memo` em componente que recebe `children` ou uma função inline: a
  comparação sempre falha, o custo é puro.
- `memo` em componente trivial: comparar props custa mais que renderizar.
- `memo` com comparador customizado que ignora uma prop que importa: bug
  silencioso, `alta`.

### Componente definido dentro de outro

```tsx
function Pai() {
  function Filho() { … }   // ← tipo novo a cada render
  return <Filho />;
}
```

React vê um tipo de componente diferente a cada render: desmonta e remonta,
perde estado interno e refaz efeitos. `critica` se `Filho` tem estado.

## Específico de Next.js

### `"use client"` alto demais

Um `"use client"` no `layout.tsx` raiz torna toda a árvore cliente. **Confirmar:**
para cada `"use client"`, veja se o arquivo realmente usa estado, efeito, ref
com comportamento ou handler. Se não usa, é fronteira mal colocada.

Severidade `alta` quando está num layout ou numa página; `media` num
componente intermediário.

### Client component sem `children` como slot

O padrão que salva árvore: um client component que recebe conteúdo de servidor
via `children` mantém esse conteúdo no servidor. Importar o filho dentro do
client component o transforma em cliente também. É um dos ganhos maiores
disponíveis em App Router e passa despercebido com frequência.

### Waterfall de `await` sequencial

```tsx
const a = await getA();      // ← espera
const b = await getB();      // ← só então começa
const [a, b] = await Promise.all([getA(), getB()]);   // paralelo
```

Só é finding quando as chamadas são de fato independentes. Severidade pela
latência somada, se der para estimar.

### `dynamic`/`Suspense` ausente em componente pesado abaixo da dobra

Fronteira com `bundle-deps`: se o achado é "esse chunk não precisava vir no
carregamento inicial", é de lá. Se é "esse componente bloqueia a hidratação da
página", é seu.

## Fora do escopo deste arquivo

Tamanho de bundle, tree-shaking, `next/image`, fontes, cache de fetch e
revalidação — tudo `audit-bundle-deps`.

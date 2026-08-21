# Catálogo — padrões em nível de código

Cada item: o padrão, como confirmar que é real, e o que o `cenario` precisa
provar. Nada aqui vira finding sozinho.

## Duplicação

`jscpd` acha cópia literal. O que importa mais são as duas variantes que ele
**não** acha:

**Duplicação divergente.** Mesma intenção, implementações diferentes. Procure
por nomes parecidos:

```bash
grep -rn "function format\|const format\|export function parse" src | sort
```

Três `formatarData` com regras de fuso diferentes é bug latente. **Cenário:**
mostre a divergência concreta — "`formatarData` em `utils/data.ts` usa
`toLocaleDateString('pt-BR')` e a de `components/tabela.tsx` usa `slice(0,10)`
sobre ISO, então a mesma data aparece diferente nas duas telas."

**Duplicação corrigida pela metade.** Procure no histórico:

```bash
git log --format='%h %s' --since='1 year ago' | grep -iE 'corrig|fix|bug' | head -20
git show <hash> --stat
```

Se um commit de correção tocou um arquivo e existe cópia da mesma lógica em
outro que não foi tocado, esse é o achado mais valioso que este eixo produz.
`alta`, esforço `baixo`, risco `baixo`.

**O que não é duplicação:** dois componentes visualmente parecidos com
comportamentos diferentes; boilerplate de framework; testes.

## Código morto

Quatro graus, com consequências diferentes:

| Grau | Consequência | Severidade |
|---|---|---|
| Export não usado, arquivo não importado | Confunde, mas o bundler elimina | `baixa` |
| Arquivo não importado mas com efeito colateral no topo | Não é eliminado; pode rodar | `media` |
| Export não usado num arquivo que **é** importado | Vem no bundle | `media` |
| Componente/rota atrás de flag desligada há muito tempo | Mantido, testado (ou não) e nunca executado | `media` |

Sempre confirme contra os entrypoints do recon antes de reportar. `knip` não
conhece rotas de arquivo (Next `app/`, `pages/`, `expo-router`) sem
configuração.

Variante que vale checar à parte: `package.json` com dependência que nenhum
arquivo importa (`depcheck`). Isso é achado de `bundle-deps`, não seu —
repasse mentalmente, não reporte.

## Tipagem

### Fronteiras

O `any` que importa está em quatro lugares:

```bash
grep -rn "props: any\|: any\[\]\|as any\|(e: any)\|catch (e: any)" src --include='*.tsx' --include='*.ts'
```

1. **Props de componente exportado** — o consumidor perde autocomplete e
   checagem. `alta`.
2. **Retorno de fetch/axios** — o dado externo entra sem validação e se espalha
   tipado como qualquer coisa. `alta`. Correção: tipo explícito, ou validação
   em runtime (zod/valibot) se o payload é instável.
3. **Parâmetro de callback exportado** — quem passa a função não sabe o que
   recebe.
4. **`catch (e: any)` seguido de `e.message`** — `unknown` + narrowing é a
   correção; `e` pode não ser Error.

`any` interno, num utilitário privado, onde o tipo real seria genérico
complexo: observação, não finding.

### Supressões

```bash
grep -rn "@ts-ignore\|@ts-expect-error\|eslint-disable" src
```

- `@ts-ignore` sem comentário explicando: `media`.
- `@ts-ignore` onde `@ts-expect-error` funcionaria: `baixa` — a segunda avisa
  quando o erro deixa de existir; a primeira fica lá para sempre.
- `eslint-disable` de arquivo inteiro (`/* eslint-disable */` no topo): `media`.
  Desliga tudo, inclusive regras futuras.

### Tipos frouxos que passam por tipagem

- `Record<string, any>`, `object`, `Function` — tipagem nominal sem checagem.
- Union de string onde um enum ou `as const` daria autocomplete e exaustividade.
- Props opcionais demais (`tudo?: X`) onde a maioria é obrigatória na prática:
  empurra checagem de nulidade para dentro do componente.

## Componentes

### Responsabilidades misturadas

O teste não é tamanho, é **motivo de mudança**. Um componente tem duas
responsabilidades quando duas pessoas diferentes, resolvendo problemas
diferentes, precisariam editar o mesmo arquivo.

Sinais que valem investigar (nenhum é finding sozinho):

- Mais de ~5 `useState` cujos grupos nunca se leem mutuamente.
- Um `useEffect` que faz fetch, um que sincroniza URL e um que mede DOM, no
  mesmo componente.
- Blocos separados por comentário-título (`// ---- filtros ----`) — o autor já
  sabia que eram partes distintas.

**Cenário:** nomeie as duas responsabilidades e o custo. "Alterar a validação
do formulário exige entender o cache da tabela porque as duas leem o mesmo
`useState<Registro[]>`."

### Props drilling profundo

Mais de 3 níveis passando uma prop que nenhum nível intermediário usa. Só é
finding se um dos níveis intermediários já teve que ser alterado por causa
disso — ou se são 5+ níveis. A correção nem sempre é contexto (que traz
problema de render): composição via `children` costuma ser melhor.

### Componente que renderiza componente diferente por flag booleana

```tsx
{isEdicao ? <FormEdicao … /> : <FormCriacao … />}   // com 12 props em comum
```

Se as duas metades divergiram, é duplicação disfarçada de reuso.

## Hooks customizados

- **Hook que devolve 8+ valores.** Virou um componente sem JSX. Cenário: mostre
  que os consumidores usam subconjuntos disjuntos — prova de que são dois hooks.
- **Hook que não é hook.** Função `useX` que não chama nenhum hook: é utilitário
  com nome errado, e o `use` faz o lint aplicar regras que não valem. `baixa`.
- **Hook com `if` antes de outro hook.** Viola as regras de hooks;
  `react-hooks/rules-of-hooks` acha. `critica`.
- **Lógica repetida em 2+ componentes que pede extração.** Só é finding com a
  repetição concreta apontada, e com precedente: se o projeto já extraiu hooks
  assim antes (`useScrollSpy`, `useHashRoute` são exemplos típicos), a extração
  é o padrão da casa e o achado é forte.

## Erros e estados de borda

- `catch {}` vazio: `alta`.
- `catch (e) { console.error(e) }` num caminho de usuário sem nenhum estado de
  erro na UI: `alta` — o usuário fica olhando um spinner eterno.
- `Promise` sem `.catch` e sem `await` dentro de try: rejeição não tratada.
- Fetch sem estado de erro **e** sem estado vazio: dois estados de UI que não
  existem. `media`.
- `!` (non-null assertion) em dado vindo de fora: `media`.

## Nomenclatura e organização

Só vale auditar contra um padrão que exista. Estabeleça o padrão dominante
antes:

```bash
ls src/components | head -40      # PascalCase? kebab? por área?
```

Depois compare. **Cenário precisa da contagem**: "32 dos 35 arquivos de
componente usam kebab-case; `UserProfile.tsx`, `NavBar.tsx` e `authForm.tsx`
fogem, e o import quebra em sistemas de arquivo sensíveis a maiúsculas."

Nunca imponha um padrão externo (atomic design, feature-first, colocation) a
um projeto internamente consistente. Consistência é o valor; a escolha
específica não é.

## Comentários

- Comentário que descreve comportamento que não existe mais: `media` — mente
  para quem lê.
- Bloco grande de código comentado: `baixa`, o git já guarda.
- Ausência de comentário explicando um *porquê* não óbvio (um workaround, uma
  decisão contraintuitiva): observação, não finding.

# A11y — web

## Semântica

### O elemento errado com comportamento certo

```tsx
<div onClick={abrir}>            // ← não focável, não responde a Enter/Espaço
<div onClick={abrir} role="button" tabIndex={0} onKeyDown={…}>   // funciona, mas
<button onClick={abrir}>         // ← isto, sempre que possível
```

O elemento nativo traz foco, teclado, semântica, estado desabilitado e
participação em `<form>` de graça. Reescrever tudo isso à mão é a origem da
maior parte dos defeitos deste eixo.

**Cenário:** conte as ocorrências e diga o que fica inalcançável. "Os 37 cards
da galeria usam `<div onClick>`: Tab pula todos e Enter não abre nenhum — a
listagem inteira é inacessível sem mouse."

Um único finding para todas as ocorrências do mesmo padrão.

### `<a>` sem `href`

Não é focável e não é link. `<a onClick>` sem `href` deveria ser `<button>`.
`href="#"` que não navega para lugar nenhum também é finding — e, em SPA que
roteia por hash, ele ativamente quebra a navegação: o clique muda o hash e
desmonta a view atual.

### Estrutura de página

- Um `<h1>` por página; níveis sem pular (`h2` → `h4` é finding `baixa`).
- Heading usado por tamanho de fonte, não por hierarquia.
- Landmarks: `<main>`, `<nav>`, `<header>`, `<footer>`. Ausência de `<main>` é
  `media` — leitores oferecem "pular para o conteúdo principal" a partir dele.
- Skip link ausente em página com navegação longa: `media`.
- Lista visual construída com `<div>` em vez de `<ul>/<li>`: o leitor perde o
  "lista com 12 itens". `baixa`, exceto em navegação principal.

## Foco

### Invisível

```css
:focus { outline: none }                    /* ← finding */
*:focus { outline: none }                   /* ← finding crítico, atinge tudo */
:focus-visible { outline: 2px solid … }     /* ← substituto correto */
```

Procure:

```bash
grep -rn "outline: *none\|outline:none\|outline: *0" src --include='*.css' --include='*.scss' --include='*.tsx'
```

Cada ocorrência precisa ter um substituto visível no mesmo escopo. Anel de foco
com contraste insuficiente contra o fundo conta como invisível — meça.

Detalhe que passa despercebido: uma regra global de foco com `:is(...)` carrega
a especificidade do argumento mais específico da lista, e pode vencer a regra
local de um componente. O resultado costuma ser dois anéis concêntricos, ou o
anel do componente nunca aparecendo. Se o projeto tem regra global de foco,
verifique que os controles novos herdam **um** anel, não zero e não dois.

### Perdido

- **Troca de rota em SPA** sem mover o foco: quem navega por teclado continua
  no fim da página anterior. Correção padrão: focar o `<h1>` da nova view
  (`tabIndex={-1}` + `.focus()`) e zerar o scroll do container.
- **Elemento focado removido do DOM** sem mover o foco antes: vai para o
  `<body>`.
- **`autoFocus`** em campo que não é o objetivo primário da tela: rouba
  contexto de quem usa leitor de tela.

### Preso onde não devia

`tabIndex` positivo (`tabIndex={1}`) reordena o Tab da página inteira e quase
sempre é erro. Só `0` e `-1` têm uso legítimo.

## Overlays

O contrato de um **modal**:

1. Foco entra no diálogo ao abrir.
2. Tab circula dentro dele — nunca escapa para a página atrás.
3. Esc fecha.
4. Foco volta ao elemento que abriu, ao fechar.
5. `role="dialog"` + `aria-modal="true"` + `aria-labelledby` apontando para o
   título.
6. Conteúdo atrás fica `inert` ou `aria-hidden` enquanto aberto.

Faltar qualquer um dos quatro primeiros é `alta`.

O contrato de um **popover leve** (tooltip, dropdown, menu) é deliberadamente
menor: clique fora e Esc fecham, Esc devolve o foco ao gatilho, mas o foco
**não** fica preso dentro. Por isso ele não deve usar `role="dialog"` —
anunciar como diálogo o que não se comporta como diálogo é pior que não
anunciar.

Confundir os dois contratos é finding nas duas direções: modal sem trap
(`alta`) e popover com `role="dialog"` sem trap (`media`).

## Formulários

- **`<label>` sem associação.** `htmlFor` apontando para o `id` do campo, ou o
  campo dentro do label. `placeholder` não substitui.
- **Erro de validação não associado.** `aria-invalid` no campo +
  `aria-describedby` apontando para a mensagem. Sem isso, o leitor anuncia o
  campo e não a mensagem.
- **Erro anunciado apenas visualmente.** Container de erro precisa de
  `role="alert"` ou `aria-live="assertive"`.
- **Campo obrigatório marcado só com asterisco visual.** `required` /
  `aria-required`.
- **Grupo de rádio sem `<fieldset>` + `<legend>`**: a pergunta se perde.
- **Autocomplete ausente** em campos de dados pessoais (`autocomplete="email"`,
  `"name"`, `"tel"`): critério de WCAG 2.1 e conveniência real.

## Estado

Toda mudança visual de estado precisa do `aria-*` correspondente:

| Estado | Atributo |
|---|---|
| Aberto/fechado (accordion, menu, disclosure) | `aria-expanded` |
| Item atual (breadcrumb, paginação, etapa, nav) | `aria-current` |
| Selecionado (listbox, tab, opção) | `aria-selected` |
| Ligado/desligado (switch) | `aria-checked` com `role="switch"` |
| Ordenação de coluna | `aria-sort` no `<th>` |
| Campo com erro | `aria-invalid` |
| Controle desabilitado | `disabled` nativo, não só opacidade |
| Carregando | `aria-busy`, ou região viva com o texto de estado |

**Estado marcado só por cor é `alta`** — falha para leitor de tela e para
daltonismo ao mesmo tempo.

O mesmo princípio vale para conteúdo estático, não só interativo: um recurso
"não incluído" marcado apenas por cor precisa de um segundo sinal (forma,
ícone diferente, texto riscado) além da cor.

## Regiões vivas

Conteúdo que aparece sem ação direta — toast, resultado de busca, contador,
erro assíncrono — precisa de `aria-live`.

Detalhe que quebra na prática: **o container precisa já existir no DOM antes
do conteúdo entrar**. Leitores de tela só anunciam inserções em regiões vivas
que já estavam lá. Criar o container junto com o toast faz o anúncio se perder
— e o código parece correto.

`aria-live="polite"` para a maioria; `"assertive"` só para o que interrompe
legitimamente (erro que bloqueia).

## Imagens e ícones

- Imagem informativa sem `alt`: `alta`.
- Imagem decorativa com `alt` descritivo: ruído, `baixa`.
- Ícone dentro de botão que já tem texto: `aria-hidden="true"` no ícone.
- Ícone sozinho carregando informação (estrelas de avaliação, indicador de
  status): precisa de equivalente textual — `role="img"` + `aria-label` no
  container, `aria-hidden` em cada parte.
- SVG inline sem `aria-hidden` nem `role`: alguns leitores anunciam o conteúdo
  bruto.

## Movimento

`prefers-reduced-motion: reduce` precisa desligar ou encurtar:

- Parallax, deriva e pulsação de fundo
- Auto-scroll e marquee (parar de verdade — `animation: none`; e se o conteúdo
  é duplicado para fechar o loop, a cópia precisa sumir, senão parece bug)
- Carrossel automático
- Transições longas de entrada/saída

Exceção legítima: movimento que é resposta direta e imediata a uma ação do
usuário (arrastar, seguir o cursor) pode permanecer — não é animação ambiente.

Ausência total de qualquer bloco `prefers-reduced-motion` num projeto com
animações é `media` — um finding só, não um por animação.

## Contraste e cor

Método e limites no SKILL.md. Aqui, o que costuma reprovar:

- Texto secundário/`muted` em cinza claro sobre fundo claro.
- Placeholder de input (frequentemente abaixo de 4.5:1).
- Texto sobre imagem ou gradiente sem véu.
- Borda de input e ícones informativos, que precisam de 3:1 e quase nunca são
  medidos.
- Estado `:disabled` — isento de 4.5:1 pela WCAG, mas ilegível na prática se
  for baixo demais.
- Tema claro reprovando onde o escuro passa. Meça os dois.

Cor de série de gráfico tem um critério a mais: precisa ser distinguível sob
daltonismo, não só ter contraste com o fundo. Se o projeto tem gráficos,
verifique que as séries se separam em protanopia/deuteranopia — e que
informação de dado nunca depende só da cor (rótulo direto, padrão, forma do
marcador).

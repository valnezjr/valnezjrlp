# Formato de finding

Contrato compartilhado pelos cinco produtores de achado (os quatro
especialistas + a consolidação). É o que permite deduplicar, ordenar e
renderizar sem que cada eixo invente o próprio formato.

Cada especialista devolve **um array JSON e nada mais**. Sem prosa antes,
sem markdown ao redor, sem arquivo escrito.

## Campos

```jsonc
{
  "id": "perf-004",                    // <eixo-curto>-<seq>, único no array do eixo
  "eixo": "render-perf",               // render-perf | clean-code | bundle-deps | a11y | seguranca | arquitetura
  "severidade": "alta",                // critica | alta | media | baixa  (ver severidade.md)
  "titulo": "Provider de tema recria o value a cada render",

  "arquivo": "src/app/providers.tsx",  // sempre relativo à raiz do repo, sempre com /
  "linha": 42,                         // 1-indexada, a linha exata do problema
  "linhaFim": 47,                      // opcional, quando o problema é um bloco

  "evidencia": "<ThemeContext.Provider value={{ theme, setTheme }}>",
  "cenario": "Qualquer setState em qualquer lugar da árvore acima re-renderiza este provider; o objeto literal em `value` tem identidade nova a cada vez, então os 14 componentes que consomem ThemeContext re-renderizam junto, mesmo com o tema inalterado.",
  "impacto": "Re-render em cascata de toda a árvore consumidora a cada mudança de estado do App.",

  "correcao": "Envolver o value em React.useMemo([theme]) ou separar o setter num contexto próprio.",
  "esforco": "baixo",                  // baixo (<30min) | medio (<meio dia) | alto (mais que isso)
  "confianca": "alta",                 // alta | media | baixa
  "risco": "baixo",                    // risco de a correção quebrar algo: baixo | medio | alto

  "origem": "leitura",                 // leitura | ferramenta:<nome> | consolidacao
  "regra": "comunidade:context-value-identity",  // comunidade:<id> ou convencao:<id>
  "eixosRelacionados": [],             // preenchido só pela consolidação
  "referencia": "https://react.dev/reference/react/useMemo"  // opcional
}
```

## As três regras duras

**1. `cenario` é obrigatório e precisa ser concreto.**

Um cenário concreto nomeia entrada, estado ou condição e diz o que acontece.
Se a frase funcionaria igualzinha colada em qualquer outro projeto React, não
é cenário — é boa prática genérica, e o item vira observação.

| Não é cenário | É cenário |
|---|---|
| "Pode causar re-renders desnecessários." | "Com os 200 itens que `usePedidos` devolve hoje, digitar uma letra no filtro re-renderiza as 200 linhas porque `onSelect` é recriado a cada tecla." |
| "Falta memoização." | "`sortedRows` reordena 1.400 registros a cada render; o componente re-renderiza a cada `mousemove` por causa do `onMouseMove` no pai." |
| "Não é acessível." | "O `<div onClick>` do card não recebe foco por Tab e não responde a Enter — a galeria inteira (37 cards) é inalcançável por teclado." |
| "Dependência desatualizada." | "`react-query@3` não recebe patch desde 2023 e o projeto usa `useQuery` em 22 arquivos; a v5 mudou a assinatura de `onError`." |

**2. `evidencia` é literal.** Copiada do arquivo, não parafraseada. É o que
permite o leitor confirmar em dois segundos que o achado é real. Se o trecho
passa de ~5 linhas, use `linhaFim` e cite só o essencial.

Exceção única, no eixo `seguranca`: **valor de credencial nunca vai literal.**
Mascare (`sk_live_****`), mantendo só o prefixo identificador. O relatório é um
arquivo compartilhável; um segredo copiado para dentro dele é um segundo
vazamento. O validador rejeita findings com credencial em claro.

**3. `confianca` é honesta.**

| Nível | Quando |
|---|---|
| `alta` | A ferramenta apontou, ou o código foi lido e o mecanismo é inequívoco. |
| `media` | O mecanismo é claro mas o impacto depende de dados de runtime que não foram medidos. |
| `baixa` | Inferido sem poder rodar a ferramenta (build quebrado, deps não instaladas), ou depende de como o consumidor usa. |

Finding com `confianca: "baixa"` **nunca** recebe severidade `critica`. Se o
mecanismo é grave o bastante para ser crítico, ele merece ser confirmado
antes de entrar.

## Observações

O que não passa na regra do cenário não é descartado — vira observação, num
array separado, com formato reduzido:

```jsonc
{ "eixo": "clean-code", "arquivo": "src/utils/format.ts", "nota": "Três funções de formatação de data com implementações diferentes; nenhuma tem bug aparente, mas convergir facilitaria manutenção." }
```

Observações aparecem numa aba própria do relatório, não entram na contagem
de débito e nunca aparecem no topo.

## Anti-catálogo

Coisas que **não** são finding em nenhum eixo, por mais tentador que seja:

- Preferência de estilo que o Prettier/ESLint do projeto já aceita.
- Ausência de testes como item genérico. (A ausência de suíte entra uma vez
  só, na seção de limites do relatório.)
- "Poderia usar a biblioteca X" sem um problema concreto que X resolve.
- `any` isolado num ponto onde a tipagem real seria desproporcional — só
  vira finding quando `any` está numa fronteira (props públicas, retorno de
  fetch, payload de API).
- Padrão que o `.audit/convencoes.md` do projeto declara explicitamente.
- Componente grande **só** por ser grande. Tamanho é sinal, não achado:
  precisa vir junto com uma consequência observável (duas responsabilidades
  que mudam por motivos diferentes, um estado que vaza entre elas, etc.).

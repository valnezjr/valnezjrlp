# Arquitetura — camadas, fronteiras e estrutura

O nível acima do arquivo. Aqui o critério não é "está bonito", é **o que
acontece quando alguém precisar mudar isso**.

Antes de qualquer coisa: se `.audit/convencoes.md` descreve a arquitetura do
projeto, ela é a régua. Este arquivo só governa o que ela não cobre.

## Ciclos de dependência

```bash
npx madge --circular --extensions ts,tsx,js,jsx src
npx madge --circular --extensions ts,tsx src --image /tmp/ciclos.svg   # visual, opcional
```

Ciclo é dos poucos achados objetivos deste eixo. Consequências reais:

- `undefined` em tempo de import, dependendo da ordem que o bundler escolher —
  bug que aparece só em produção, quando a ordem muda.
- Tree-shaking desligado no ciclo inteiro.
- Impossível extrair qualquer módulo do ciclo sem mexer em todos.

Severidade `alta`. Cenário: liste o caminho completo do ciclo. Correção mais
comum: extrair o tipo ou a constante compartilhada para um terceiro módulo
sem dependências.

Ciclo passando por `index.ts` de barrel é o caso mais frequente e o mais fácil
de resolver — importar do arquivo direto em vez do barrel quebra o ciclo.

## Barrels

Um `index.ts` que reexporta tudo de uma pasta.

- **Custo de bundle**: importar uma coisa do barrel arrasta a análise de todas.
  Isso é achado de `bundle-deps`, não seu.
- **Custo de arquitetura, que é seu**: barrel é a principal fábrica de ciclos, e
  esconde o grafo real de dependências de quem lê.

Só vira finding quando produz ciclo ou quando a pasta tem 20+ módulos. Um
barrel na raiz de uma biblioteca (`src/index.ts` como lista canônica de
exports públicos) é padrão correto e não é finding nunca.

## Fronteiras entre camadas

Camadas típicas num front React, do mais estável para o mais volátil:

```
tipos / constantes  →  utilitários puros  →  acesso a dados  →  hooks  →  componentes  →  rotas/telas
```

A regra: dependência aponta para dentro. O achado é a seta invertida.

**Inversões que valem reportar:**

| Padrão | Por que custa |
|---|---|
| Utilitário importando componente | O util deixa de ser testável e reutilizável isoladamente |
| Camada de dados importando de `components/` | Trocar a UI força mexer no fetch |
| Tipo de domínio definido dentro de um componente e importado por outros | O tipo morre se o componente for removido |
| `hooks/` importando de `app/` ou `pages/` | O hook fica preso àquela rota |

**Cenário:** mostre a consequência prática. "`utils/preco.ts` importa
`components/Moeda.tsx` para reusar a tabela de símbolos; qualquer teste de
`calcularPreco` precisa de um ambiente com DOM."

## Acesso a dados espalhado

Procure a mesma URL, ou o mesmo endpoint, em mais de um lugar:

```bash
grep -rnoE "(fetch|axios)\([\"'\`][^\"'\`]+" src | sed -E 's/.*[\"'\''`]//' | sort | uniq -c | sort -rn | head -20
```

Três componentes chamando `/api/usuarios` direto, cada um com seu tratamento
de erro e seu formato de retorno, é o padrão que gera divergência silenciosa.
`media`; `alta` se os tratamentos já divergiram.

Não confunda com projeto que usa TanStack Query/SWR corretamente: várias
chamadas ao mesmo `useQuery(["usuarios"])` são o desenho, não o problema.

## Estrutura de pastas

Não audite contra uma arquitetura de referência. Audite contra **a que o
projeto já tem**.

1. Identifique o padrão dominante: por tipo (`components/`, `hooks/`, `utils/`),
   por feature (`features/pedidos/…`), ou híbrido.
2. Conte quantos módulos seguem e quantos fogem.
3. Só reporte se a exceção causa problema concreto: import cruzado entre
   features que deveriam ser independentes, arquivo que ninguém acha, pasta
   `misc/`/`helpers/`/`common/` virando depósito.

Uma pasta `utils/` com 40 arquivos sem relação entre si é finding — não por
ser `utils/`, mas porque ninguém sabe o que tem lá e a duplicação nasce daí.
Cenário: aponte a duplicação que já existe dentro dela.

## Monorepo

Quando o recon achou workspaces:

- **Dependência entre pacotes que deveriam ser independentes.** `apps/web`
  importando de `apps/mobile` (e não de `packages/…`) é `alta`.
- **Código compartilhado copiado em vez de extraído.** Duas cópias em
  `apps/web/utils` e `apps/mobile/utils`. O achado é a divergência, quando
  já houver.
- **Versões diferentes da mesma dependência entre pacotes.** React 18 num app e
  19 noutro, com um `packages/ui` compartilhado, é `alta` — o pacote
  compartilhado não pode assumir nenhuma das duas.
- **Pacote sem fronteira declarada.** `package.json` sem `exports`, permitindo
  que qualquer app importe qualquer arquivo interno. `media`.

## Fronteira servidor/cliente (Next App Router)

Arquitetural, não de performance (o custo de render é de `render-perf`):

- **`"use client"` sem necessidade.** O arquivo não usa estado, efeito, ref
  com comportamento nem handler. Verifique antes de reportar — `useId` sozinho
  não exige cliente; `useRef` só para guardar valor, também não.
- **Segredo importado em client component.** Chave de API, token, `process.env`
  sem prefixo público num arquivo com `"use client"`. `critica` — vai para o
  bundle do navegador.
- **Server action sem validação de entrada.** Recebe o que o cliente mandar.
  `alta`.
- **Componente de servidor importando de arquivo com `"use client"` no topo,
  só para usar um tipo.** Arrasta a fronteira sem precisar; `import type`
  resolve.

## React Native — estrutura

- **Código específico de plataforma espalhado em `if (Platform.OS === …)`
  dentro de componentes**, em vez de `.ios.tsx`/`.android.tsx` ou de um módulo
  com a diferença isolada. Só é finding a partir de ~4 ramificações no mesmo
  arquivo, ou quando os dois ramos já divergiram em comportamento.
- **Lógica de negócio dentro de tela de navegação.** A tela deveria montar; a
  regra deveria estar num hook ou serviço. Vira finding quando a mesma regra
  precisa existir em outra tela.
- **Módulo nativo acessado direto do componente**, sem uma camada fina que
  isole a API. Trocar a lib nativa passa a exigir mexer em todas as telas.
- **Navegação tipada por string solta.** `navigate("Detalhe", { id })` sem
  tipagem de rotas: erro de nome só aparece em runtime, num app publicado.
  `media` em TS.

## Configuração e ambiente

- Valor de configuração hardcoded em componente (URL de API, chave, timeout).
  `media`; `alta` se difere entre ambientes e o código não sabe disso.
- `.env` versionado com valor real (não `.env.example`): **não é achado seu** —
  é de `audit-seguranca`, e é crítico lá. Se você topar com isso primeiro,
  avise o usuário na hora, sem incluir o valor em lugar nenhum, e deixe o
  finding para o eixo de segurança.
- Config duplicado entre `next.config.js`, `tsconfig.json` e código (aliases de
  path definidos em dois lugares que já divergiram).

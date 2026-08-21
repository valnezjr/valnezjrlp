---
name: audit-convencoes
description: Extrai as convenções reais de um projeto React ou React Native lendo o código e a documentação dele, e gera o arquivo .audit/convencoes.md que as skills de auditoria usam como régua. Use quando o pedido for "extrair as convenções desse projeto", "gerar o arquivo de convenções", "documentar o padrão que eu já sigo", ou antes da primeira auditoria de um repo cujo padrão deve prevalecer sobre o consenso da comunidade. Roda uma vez por projeto, não faz parte da auditoria em si. Não usar para auditar código nem para propor mudanças de padrão.
---

# Audit Convenções

Produz `.audit/convencoes.md`: a régua contra a qual as quatro skills de
auditoria medem o projeto. Roda **uma vez por projeto**, não a cada auditoria.

Sem esse arquivo, os especialistas auditam contra o consenso do ecossistema —
o que funciona, mas gera atrito num projeto que decidiu diferente de propósito.
Com ele, as regras do projeto vencem, e o relatório separa "viola o padrão que
eu mesmo escrevi" de "contraria o consenso geral".

## A regra que define esta skill

**Documenta o que o repo faz, não o que deveria fazer.**

Esta skill não propõe padrão, não corrige, não opina. Se o projeto usa
`index` como key em três lugares e isso não é o padrão dominante, isso não vira
regra — vira nada. Se o projeto sistematicamente evita `useMemo` e há um
comentário explicando por quê, isso **é** a regra, mesmo contrariando a
literatura.

A pergunta a cada candidato a regra: *isso é uma decisão do projeto, ou um
acidente que se repetiu?*

## Como distinguir decisão de acidente

Quatro fontes, em ordem de confiança:

1. **Documentação interna** — `CLAUDE.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`,
   `COMPONENT_GUIDELINES.md`, ADRs, `docs/`. O que está escrito ali é decisão
   declarada. Confiança máxima — mas confirme que o código ainda segue: doc
   que descreve um padrão abandonado é a pior régua possível.
2. **Configuração** — `eslint.config.*`, `tsconfig.json`, `.editorconfig`,
   `prettier`. Regra ligada é decisão explícita. Não repita no `convencoes.md`
   o que o linter já garante: se o ESLint reprova, a auditoria não precisa
   olhar.
3. **Unanimidade no código** — 30 de 30 componentes fazem igual. É decisão,
   ainda que nunca escrita.
4. **Maioria com exceções explicadas** — 27 de 30 fazem igual e as 3 exceções
   têm comentário justificando. Também é decisão; as exceções fazem parte da
   regra.

**Não é regra:** 18 de 30. Isso é o projeto sem padrão nesse ponto, e o
`convencoes.md` deve dizer isso explicitamente — "sem padrão estabelecido" é
uma informação útil, e impede a auditoria de escolher um lado sozinha.

## Fluxo

### 1. Ler a documentação interna

```bash
ls *.md docs/*.md .github/*.md 2>/dev/null
find . -iname 'adr*' -o -iname 'decisions*' -not -path '*/node_modules/*'
cat CLAUDE.md CONTRIBUTING.md ARCHITECTURE.md 2>/dev/null
```

Anote cada regra declarada. Marque como **a confirmar** — nenhuma entra sem
verificação no código.

### 2. Ler a configuração

`eslint`, `tsconfig` (`strict`?), `prettier`, `.editorconfig`, aliases de path,
scripts do `package.json` (o que existe de verificação automatizada, e o que
não existe).

### 3. Contar padrões no código

Roteiro completo em [references/o-que-extrair.md](references/o-que-extrair.md).
Cada eixo tem um comando de contagem e um limiar.

### 4. Confrontar doc com código

O passo que dá valor a esta skill. Para cada regra declarada na documentação,
conte quantos arquivos a seguem.

- **Segue em 100%** → entra como regra, com a fonte.
- **Segue na maioria** → entra como regra, e as exceções entram numa seção
  própria (a auditoria vai apontá-las como violação, o que é o comportamento
  desejado).
- **Não segue** → **não entra como regra.** Entra na seção "declarado mas não
  praticado", que é informação valiosa por si só: ou a doc envelheceu, ou o
  padrão foi abandonado sem ninguém registrar.

### 5. Escrever o arquivo

Formato e exemplo completo em
[assets/exemplo-mothership-ds.md](assets/exemplo-mothership-ds.md) — um
`convencoes.md` real, extraído de um design system em React/TS, que serve de
modelo de nível de detalhe e de tom.

## Formato de saída

Toda regra precisa ser **verificável**: um auditor precisa conseguir marcar
"viola" ou "não viola" sem julgamento de gosto.

```markdown
### Merge de classes CSS

`[...].filter(Boolean).join(" ")` inline no componente, ou um `cx()` local ao
arquivo. **Não existe helper compartilhado** e não há dependência de `clsx`
ou `classnames`.

- **id:** `merge-classes`
- **fonte:** COMPONENT_GUIDELINES.md § Template + 18/18 componentes
- **viola quem:** importa `clsx`/`classnames`, ou concatena classes com
  template string sem filtrar valores falsy
```

O campo `id` é o que aparece nos findings como `convencao:merge-classes`. Sem
ele a auditoria não consegue citar a regra.

Regra que não passa no teste "dá para marcar viola/não viola" fica de fora, ou
vai para uma seção `## Princípios` — que a auditoria lê como contexto, nunca
como critério de finding.

## Estrutura do arquivo gerado

```markdown
# Convenções — <projeto>

<uma frase sobre o que é o projeto e qual stack>
Extraído em <data>, de <N> arquivos. Reveja quando a stack mudar.

## Stack real          ← o que o projeto de fato usa, e o que ele NÃO usa
## Regras              ← as verificáveis, agrupadas por eixo, cada uma com id
## Sem padrão          ← pontos onde o projeto não decidiu; a auditoria não opina
## Declarado mas não praticado
## Arquivos gerados    ← nunca auditar, nunca editar
## Princípios          ← contexto, não critério
```

A seção **Stack real** merece atenção especial: dizer o que o projeto **não**
tem (não tem Storybook, não tem Vitest, não tem CSS Modules, não tem etapa de
build) evita a classe inteira de achado falso em que a auditoria sugere ajustar
uma ferramenta que não existe ali.

## Quando NÃO usar esta skill

- Para propor melhorias de padrão. Esta skill fotografa; não opina.
- Para auditar. As convenções são a régua, não o resultado.
- Num repo que você não conhece e cujo padrão o usuário não quer preservar —
  aí a auditoria contra o consenso da comunidade é mais útil.
- A cada auditoria. Rode uma vez, e de novo só quando a stack mudar de verdade
  (migração de framework, adoção de uma ferramenta nova, reorganização de
  pastas).

## Depois de gerar

Mostre o arquivo ao usuário e peça revisão antes da primeira auditoria. Duas
perguntas específicas, que só ele pode responder:

1. **Alguma regra aqui é acidente, não decisão?** Regra errada envenena toda
   auditoria futura — vira falso positivo repetido.
2. **Algo em "sem padrão" deveria virar regra?** É a chance de decidir agora o
   que nunca foi decidido, com a contagem real na mão.

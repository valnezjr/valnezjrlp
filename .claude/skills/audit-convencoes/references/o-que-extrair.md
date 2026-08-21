# O que extrair

Roteiro de contagem. Cada item: o comando, o limiar e o que escrever.

**Limiar padrão:** ≥ 90% dos casos → regra. Entre 60% e 90% → regra com seção
de exceções. Abaixo de 60% → "sem padrão".

Ajuste o denominador ao que faz sentido: componentes, hooks, arquivos de rota.
Contar "todos os arquivos .tsx" mistura coisas que nunca seguiram o mesmo
padrão.

## Estrutura e nomenclatura

```bash
ls src/components src/hooks src/utils 2>/dev/null
find src -maxdepth 2 -type d
```

Perguntas a responder com número:

- **Organização**: por tipo (`components/`, `hooks/`), por feature
  (`features/pedidos/`), ou híbrido? Conte as pastas de cada estilo.
- **Granularidade de arquivo**: um componente por arquivo, ou arquivos por
  área com vários componentes? Conte exports de componente por arquivo.
- **Nomenclatura de arquivo**: PascalCase, kebab-case, camelCase. Conte.
  Projeto que usa PascalCase para arquivo de um componente só e kebab para
  arquivo de área tem **duas** regras coerentes, não uma inconsistência —
  descreva as duas.
- **Colocation**: teste, estilo e tipos junto do componente ou em pastas
  separadas?
- **Barrels**: existe `index.ts` por pasta? Um só na raiz? Nenhum?

## Componentes

```bash
# declaração
grep -rc "^export function \|^export const .* = (" src/components/*.tsx | head

# props
grep -rn "interface .*Props\|type .*Props" src/components/*.tsx | head -20

# forwardRef
grep -rc "forwardRef" src/components/*.tsx
```

- **Forma de declaração**: `export function X()` vs. `export const X = () =>`.
- **Tipagem de props**: `interface XProps extends React.HTMLAttributes<T>`?
  `type`? Props inline? Extensão do elemento nativo é comum ou rara?
- **`className` e `{...rest}` repassados** ao elemento raiz: conte quantos
  componentes fazem. Se for regra, é das mais úteis para a auditoria — é
  verificável mecanicamente e quebra a composição quando falta.
- **`forwardRef`**: padrão ou exceção?
- **Default export vs. nomeado.**
- **Documentação de props**: JSDoc nas props públicas?

## React e hooks

```bash
grep -rc "^import React from" src | head
grep -rc "React.useState\|React.useEffect" src | head
grep -rc "^import { useState" src | head
grep -rn "useMemo\|useCallback\|React.memo" src | wc -l
```

- **Import de React**: namespace (`React.useState`) ou hooks nomeados
  (`useState`)? Essa é das convenções mais visíveis e mais fáceis de violar
  sem perceber.
- **Postura sobre memoização.** Importante e frequentemente subestimada: um
  projeto que quase não usa `useMemo`, com comentários explicando "arrays
  pequenos, sem necessidade", tem uma decisão — e uma auditoria que não sabe
  disso vai produzir dezenas de falsos positivos. Procure comentários assim,
  eles são ouro.
- **Hooks customizados**: onde moram? Privados ao arquivo ou exportados?
  Prefixo?
- **Estado**: `useState` local, contexto, store externo? Qual, e para quê?

## Estilização

```bash
ls src/styles src/*.css 2>/dev/null
grep -rc "className=" src | head -5
grep -rn "styled\.\|css\`" src | head -5
```

- **Abordagem**: CSS global, CSS Modules, Tailwind, CSS-in-JS, `StyleSheet`
  (RN).
- **Convenção de nomes de classe**: prefixo? BEM? utilitárias?
- **Tokens**: existe fonte única de variáveis? Valores crus são proibidos?
  Se sim, isso é regra forte e mecanicamente verificável — a auditoria pode
  procurar `px` e cores literais no CSS novo.
- **Tema**: claro/escuro? Como é feita a troca?
- **Breakpoints**: quais valores, definidos onde?

## TypeScript

```bash
cat tsconfig.json
grep -rn ": any" src | wc -l
grep -rn "@ts-ignore\|@ts-expect-error" src | wc -l
```

- `strict` ligado?
- Tolerância a `any`: 0 ocorrências é regra. 200 é "sem padrão", e a auditoria
  vai olhar só as fronteiras.
- `interface` vs. `type` para objeto: conte.
- Aliases de path (`@/`) configurados e usados?

## Acessibilidade

```bash
grep -rn "aria-" src | wc -l
grep -rn "accessibilityLabel\|accessibilityRole" src | wc -l   # RN
grep -rn "prefers-reduced-motion" src
```

Se existe um `ACCESSIBILITY.md`, ele é a fonte primária. Verifique cada regra
declarada contra o código.

Procure especificamente por um **contrato de foco** documentado ou implícito
para overlays (modal prende foco e devolve; popover leve não prende). Projetos
que têm esse contrato bem definido produzem auditorias muito mais precisas —
e a ausência dele é, por si só, informação para a seção "sem padrão".

## Fronteira servidor/cliente (Next)

```bash
grep -rln '"use client"' src app 2>/dev/null | wc -l
find src app -name '*.tsx' 2>/dev/null | wc -l
```

Qual a proporção? O projeto trata `"use client"` como exceção documentada ou
como padrão? Existe uma regra escrita sobre quando aplicar?

## Testes e verificação

```bash
cat package.json | grep -A15 '"scripts"'
find . -name '*.test.*' -o -name '*.spec.*' -not -path '*/node_modules/*' | wc -l
```

O que existe de verificação automatizada — e o que não existe. Um projeto cuja
única verificação é `tsc --noEmit`, validado visualmente, é uma decisão
legítima: registre-a. A auditoria precisa saber disso para calibrar o risco de
cada refatoração que sugerir.

## Idioma e comentários

```bash
git log --format='%s' -30
```

- Idioma de commits, comentários e documentação.
- Convenção de mensagem de commit (conventional commits? prosa?).
- Postura sobre comentário: só para o *porquê* não óbvio, ou documentação
  extensiva?

## Arquivos gerados

Procure no código e na doc por arquivos que **não devem ser editados à mão** —
gerados por script, exportados de outra ferramenta, sincronizados de um asset.

```bash
grep -rn "gerado\|generated\|do not edit\|não editar" src --include='*.ts' --include='*.tsx' -i | head
```

Essa lista precisa entrar no `convencoes.md`: auditar um arquivo gerado é
desperdício, e sugerir editá-lo é conselho errado.

## O que NÃO extrair

- Qualquer coisa que o Prettier/ESLint já garante (aspas, ponto e vírgula,
  indentação, ordem de import). Duplicar isso enche o arquivo de regra que a
  auditoria nunca deveria precisar checar.
- Preferência que aparece em menos de 60% dos casos.
- Regra aspiracional que a documentação declara e o código não segue — essa
  vai para "declarado mas não praticado", que é uma seção diferente.
- Qualquer coisa que você acha que o projeto *deveria* fazer.

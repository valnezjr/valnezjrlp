---
name: audit-frontend
description: Auditoria completa de um projeto front-end React — varre o repositório inteiro e produz um relatório HTML navegável com achados priorizados de performance de render, limpeza de código e arquitetura, peso de bundle e dependências, acessibilidade e segurança. Detecta sozinha a stack (Next.js App Router, React SPA com Vite/CRA, React Native com Expo ou RN CLI) e delega para as skills especialistas. Use quando o pedido for "auditar o projeto", "revisar a qualidade do código", "onde está o débito técnico daqui", "esse projeto está lento/pesado/bagunçado", ou antes de assumir a manutenção de um repo herdado. Não usar para revisar só um diff/PR, para auditar um único componente, nem para aplicar correções — esta skill diagnostica, não conserta.
---

# Audit Frontend — orquestradora

Auditoria de repositório inteiro. Esta skill não analisa código diretamente:
ela faz o reconhecimento, decide o que auditar, delega para os cinco
especialistas, consolida os achados num artefato único e entrega o relatório.

Especialistas: `audit-render-perf`, `audit-clean-code`, `audit-bundle-deps`,
`audit-a11y`, `audit-seguranca`. Cada um também roda sozinho quando o pedido é
específico ("audita só a performance daqui") — nesse caso esta skill não entra.

## A regra que governa tudo

**Ferramenta antes de leitura. Cenário antes de achado.**

Nenhum eixo começa lendo código. Cada especialista roda primeiro o que é
determinístico (ESLint, `tsc`, `knip`, `madge`, analisadores de bundle) e só
depois gasta leitura no que a ferramenta não alcança. E nenhum item vira
*finding* sem um cenário concreto de falha — entrada, estado ou condição em
que o problema se manifesta. Sem isso, vira **observação**, que entra numa
seção separada do relatório e nunca conta como débito.

Isso existe porque auditoria de LLM tem dois modos de falhar: inventar
problema que não existe e listar boa prática genérica que não se aplica
àquele repo. As duas regras acima cortam os dois.

## Fluxo

```
1. Recon          → detecta stack, workspaces, entrypoints, escala do repo
2. Convenções     → carrega .audit/convencoes.md se existir
3. Priorização    → ranqueia arquivos por risco (git × imports × entrypoint)
4. Delegação      → dispara os 5 especialistas em paralelo (subagentes)
5. Consolidação   → deduplica, cruza, ordena, calcula o resumo
6. Entrega        → .audit/findings.json + .audit/relatorio-<data>.html
7. Baseline       → compara com .audit/baseline.json e atualiza
```

### 1. Recon

Sempre primeiro, sempre nesta skill (os especialistas recebem o resultado
pronto, não repetem a detecção). Procedimento completo em
[references/recon.md](references/recon.md). Produz um objeto `stack` com:

| Campo | Valores |
|---|---|
| `plataforma` | `web` \| `native` \| `ambas` (monorepo) |
| `framework` | `next-app` \| `next-pages` \| `vite` \| `cra` \| `expo` \| `rn-cli` \| `desconhecido` |
| `linguagem` | `ts` \| `ts-frouxo` (strict off) \| `js` |
| `workspaces` | lista de pacotes, ou `null` |
| `gerenciador` | `npm` \| `pnpm` \| `yarn` \| `bun` |
| `podeBuildar` | `true` se o script de build existe e roda |
| `entrypoints` | rotas/telas descobertas |
| `escala` | nº de arquivos `.tsx/.jsx/.ts/.js` fora de `node_modules` |

Se `framework` sair `desconhecido`, **pare e pergunte** em vez de assumir.
Auditar Next como se fosse SPA gera uma lista inteira de achados falsos sobre
`"use client"` e data fetching.

### 2. Convenções do projeto

Se existir `.audit/convencoes.md` na raiz, carregue-o e repasse para os
cinco especialistas. **As regras de lá vencem as regras da comunidade** em
caso de conflito, sem exceção e sem discussão no relatório — se o projeto
declara que memoização só entra com medição, um `useMemo` ausente não é
achado ali, mesmo que a literatura sugira o contrário.

Se não existir, os especialistas auditam contra o consenso do ecossistema e
o relatório abre com uma linha sugerindo gerar o arquivo (skill
`audit-convencoes`).

Todo finding carrega o campo `regra`, prefixado com a origem:
`convencao:<id>` ou `comunidade:<id>`. É o que permite o leitor separar "isso
viola o padrão que eu mesmo escrevi" de "isso contraria o consenso geral".

### 3. Priorização

Repo inteiro raramente cabe em contexto. Auditar tudo raso é pior do que
auditar fundo o que importa. O ranking está em
[references/priorizacao.md](references/priorizacao.md) e combina três sinais:

- **Volatilidade** — `git log --format= --name-only` nos últimos 6 meses,
  contagem por arquivo. O que muda muito quebra muito.
- **Grau de entrada** — quantos arquivos importam aquele. O que muitos usam
  espalha o problema.
- **Proximidade de entrypoint** — rotas, telas, `layout`/`_app`, providers de
  topo. O que está no caminho de todo mundo pesa em todo mundo.

A leitura profunda vai para o topo dessa lista. O resto recebe só a passada
das ferramentas. O relatório declara explicitamente quantos arquivos foram
lidos a fundo e quantos só passaram pelas ferramentas — auditoria que não
diz o que **não** olhou não é auditoria, é opinião.

### 4. Delegação

Os cinco especialistas rodam **em paralelo**, cada um num subagente, com o
mesmo pacote de entrada: `stack`, `convencoes`, `arquivosPrioritarios`,
`raiz`. Cada um devolve **apenas** um array JSON no formato de
[references/finding-format.md](references/finding-format.md) — nada de prosa,
nada de relatório próprio, nada de arquivo escrito por eles.

Uma exceção de escopo: `audit-seguranca` **não se limita aos
`arquivosPrioritarios`**. Suas varreduras mecânicas (segredos, dependências
vulneráveis, padrões perigosos) passam em todo o código-fonte, incluindo
config, CI e arquivos que ninguém edita há anos — uma chave vazada não obedece
ao ranking de volatilidade. Só a leitura dirigida dele respeita a priorização.

Se `audit-seguranca` encontrar um segredo válido em arquivo versionado, ele
avisa **imediatamente**, fora do fluxo normal. Repasse esse aviso ao usuário na
hora, antes de terminar a consolidação: rotação de credencial é urgente e o
relatório pode esperar.

Isolar cada eixo num subagente é o que mantém o contexto desta skill limpo:
a leitura pesada acontece lá dentro, aqui só chega o resultado estruturado.

Se um eixo não se aplica (ex.: `audit-bundle-deps` num projeto sem build
possível), ele ainda roda em modo degradado e devolve findings com
`confianca: "baixa"` — nunca é silenciosamente pulado, porque um eixo ausente
do relatório se lê como "está tudo bem por aqui".

### 5. Consolidação

1. **Deduplicar.** Mesmo `arquivo` + mesma `linha` ± 3 + eixos diferentes
   costuma ser o mesmo problema visto de dois ângulos. Funde num finding só,
   mantém a maior severidade, lista os dois eixos em `eixosRelacionados`.
2. **Cruzar.** Alguns achados só existem na junção — um componente que é ao
   mesmo tempo o mais volátil do repo, o mais importado e o que a `knip`
   marcou como parcialmente morto é um item de refatoração, não três avisos
   soltos. Esses viram findings de eixo `arquitetura` com
   `origem: "consolidacao"`.
3. **Ordenar.** Severidade desc, depois esforço asc. O topo do relatório
   precisa ser o que dá mais retorno por hora gasta, não o mais grave em
   abstrato.
4. **Resumir.** Contagem por eixo e severidade, os 5 arquivos com mais
   achados, e o delta contra o baseline.

Critérios de severidade — objetivos, sem margem para gosto — em
[references/severidade.md](references/severidade.md).

### 6. Entrega

Dois arquivos em `.audit/`:

- **`findings.json`** — a fonte de verdade, versionável, diffável.
- **`relatorio-<AAAA-MM-DD>.html`** — página única no visual do **Mothership
  DS**: fundo com os glows de marca, superfícies de vidro
  (`backdrop-filter`), badges por tom (crítica → danger, alta → orange, média
  → highlight, baixa → gray), anel de foco accent e `ThemeSwitch`. Tema escuro
  é o padrão, claro pela classe `.light` — a primeira visita segue a
  preferência do sistema e a escolha persiste em `localStorage`. Filtro por
  eixo, severidade e arquivo; cada finding com link
  `vscode://file/<caminho>:<linha>` que abre direto no editor.

  Os tokens do DS são **transcritos** no template, não importados: o
  relatório precisa abrir sozinho em qualquer repositório, sem o pacote
  `mothership-ds` instalado. A única referência externa é a fonte Outfit no
  Google Fonts, que degrada para a fonte do sistema quando não há rede — o
  resto é autocontido. Se o projeto auditado usa outra identidade, é o
  bloco `:root` do template que se troca, e nada mais.

Gerado por `node scripts/build-report.mjs .audit/findings.json` (Node ≥ 18,
sem dependências). O template vive em `assets/relatorio-template.html`.

Antes de gerar, rode `node scripts/validate-findings.mjs .audit/findings.json`
— ele rejeita finding sem cenário, sem arquivo existente, com linha fora do
range do arquivo ou com severidade que não bate com os critérios. **Um
findings.json que não valida não vira relatório.**

### 7. Baseline

Depois de gerar o relatório, escreva `.audit/baseline.json` com o hash de
cada finding (`eixo` + `regra` + `arquivo` + trecho normalizado da
evidência), a data e o commit. Na próxima auditoria, o relatório abre com o
delta: quantos resolvidos, quantos novos, quantos persistem.

Isso é o que transforma a auditoria de foto em acompanhamento. Sem baseline,
a segunda auditoria é indistinguível da primeira e ninguém sabe se a dívida
subiu ou desceu.

## Quando NÃO usar esta skill

- **Review de diff ou PR.** Esta skill varre o repo inteiro; num diff ela
  gasta muito e acha pouco.
- **Um componente só.** Chame o especialista do eixo direto.
- **Aplicar correções.** Esta skill diagnostica. Depois de entregar o
  relatório, ofereça corrigir, mas não comece sozinha — a decisão do que
  vale consertar é de quem mantém o projeto.
- **Pentest.** `audit-seguranca` faz auditoria **estática e defensiva**:
  leitura de código e ferramentas locais. Não há teste dinâmico, não há
  verificação de que uma falha é explorável em execução, e nada é testado
  contra sistema em produção. O relatório precisa dizer isso.
- **Backend próprio.** Se o projeto tem API fora do Next, ela não é auditada
  por nenhum eixo. Declare em vez de deixar implícito.

## Limites a declarar no relatório

Auditoria honesta declara o que não cobriu. A seção final do relatório é
gerada automaticamente e lista:

- arquivos lidos a fundo vs. total de arquivos
- eixos que rodaram em modo degradado e por quê
- ferramentas que falharam ou não puderam rodar
- ausência de `.audit/convencoes.md`, quando for o caso
- ausência de testes automatizados no projeto, quando for o caso — sem
  suíte, nenhum achado de refatoração vem com rede de segurança, e isso muda
  o cálculo de risco de cada correção sugerida
- que a auditoria de segurança foi estática, sem teste dinâmico nem pentest,
  e que a varredura de segredos cobriu o estado atual do repositório e não o
  histórico do git (a menos que o modo de histórico tenha sido acionado)
- que um backend próprio fora do Next, se existir, não foi auditado

## Ferramentas

Tudo via `npx`, nada instalado no `package.json` do projeto auditado. Lista
completa, com flags e o que fazer quando cada uma falha, em
[references/ferramentas.md](references/ferramentas.md).

Se o projeto não tem `node_modules` instalado, **não rode `npm install` por
conta própria** — pergunte. Instalar dependências num repo alheio muda
lockfile e pode disparar scripts de postinstall.

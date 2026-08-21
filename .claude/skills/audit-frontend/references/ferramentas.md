# Ferramentas

Tudo via `npx`, nunca instalado no `package.json` do projeto auditado. A
auditoria não pode deixar rastro no repo além de `.audit/`.

Regra geral de degradação: se uma ferramenta falha, **não invente o resultado
dela**. Registre a falha nos limites do relatório, siga com leitura manual e
marque os findings daquele eixo com `confianca: "media"` ou `"baixa"`.

## Sempre, em qualquer stack

| Ferramenta | Comando | Serve para |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | Erros de tipo pré-existentes; base de tudo |
| ESLint do projeto | `npx eslint . --format json` | O que o time já sabe — **não reporte de novo** |
| knip | `npx knip --reporter json` | Exports, arquivos e deps não usados |
| madge | `npx madge --circular --extensions ts,tsx src` | Ciclos de dependência |
| jscpd | `npx jscpd src --min-lines 12 --reporters json --silent` | Duplicação de código |
| depcheck | `npx depcheck --json` | Deps declaradas e não usadas, e o contrário |
| npm audit | `npm audit --json` | Vulnerabilidades conhecidas nas dependências |
| osv-scanner | `npx --yes osv-scanner@latest scan source ./` | Segunda opinião sobre vulnerabilidades, base OSV |
| secretlint | `npx --yes @secretlint/quick-start "**/*"` | Segredos no estado atual do repo |

As duas últimas alimentam `audit-seguranca`. A saída do `npm audit` **não vai
crua para o relatório** — os critérios de filtragem estão no SKILL.md daquele
eixo. E qualquer ferramenta de segredo roda com redação ligada
(`gitleaks --redact`): a saída não pode imprimir os valores.

`knip` sem configuração produz falso positivo em projeto com entrypoints
implícitos (rotas de Next, `expo-router`). Rode com `--include files,exports`
e trate "arquivo não usado" que é rota como falso positivo conhecido.

## Web

| Ferramenta | Comando | Eixo |
|---|---|---|
| eslint-plugin-react-hooks | `npx eslint --no-eslintrc --plugin react-hooks --rule '{"react-hooks/exhaustive-deps":"warn","react-hooks/rules-of-hooks":"error"}' 'src/**/*.{ts,tsx}'` | render-perf |
| eslint-plugin-jsx-a11y | mesma forma, plugin `jsx-a11y`, preset `recommended` | a11y |
| Next bundle analyzer | `ANALYZE=true npx next build` com `@next/bundle-analyzer` no config | bundle-deps |
| source-map-explorer | `npx source-map-explorer 'dist/assets/*.js' --json` | bundle-deps (Vite/CRA) |
| axe-core via Playwright | script próprio, ver abaixo | a11y |

Se o projeto já tem os plugins de ESLint ligados, **não rode de novo** — leia
a saída do ESLint do projeto. Rodar o plugin por fora num projeto que já o
tem gera lista duplicada e faz o relatório parecer maior do que é.

### axe em rotas-chave

Só quando `podeBuildar: true` e existe um comando de dev/preview. Suba o
servidor, visite os entrypoints principais, rode axe-core em cada um:

```js
// .audit/axe-run.mjs — descartável, apague depois
import { chromium } from "playwright";
import fs from "node:fs";
const rotas = process.argv.slice(2);
const base = process.env.BASE ?? "http://localhost:3000";
const axe = fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const browser = await chromium.launch();
const out = [];
for (const rota of rotas) {
  const page = await browser.newPage();
  await page.goto(base + rota, { waitUntil: "networkidle" });
  await page.evaluate(axe);
  out.push({ rota, ...(await page.evaluate(() => window.axe.run())) });
  await page.close();
}
await browser.close();
fs.writeFileSync(".audit/axe.json", JSON.stringify(out, null, 2));
```

Axe cobre cerca de um terço dos critérios de WCAG. **Nunca escreva "a
acessibilidade está ok" porque o axe passou** — ele não testa ordem de foco,
qualidade de rótulo, nem se a navegação por teclado faz sentido.

## React Native

Não existe equivalente do axe nem do bundle analyzer web com a mesma
maturidade. O que dá para rodar:

| Ferramenta | Comando | Eixo |
|---|---|---|
| Bundle Metro | `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/rn.bundle --sourcemap-output /tmp/rn.map` | bundle-deps |
| source-map-explorer no bundle | `npx source-map-explorer /tmp/rn.bundle /tmp/rn.map --json` | bundle-deps |
| Expo Atlas | `EXPO_ATLAS=true npx expo export` (SDK 51+) | bundle-deps |
| eslint-plugin-react-native | regras `no-inline-styles`, `no-unused-styles` | clean-code |
| eslint-plugin-react-native-a11y | preset `all` | a11y |

`react-native bundle` demora e exige o projeto instalado. Se falhar, o eixo
de bundle roda por leitura de imports e `package.json` — e os findings saem
com `confianca: "baixa"` e sem número de KB.

## Ordem recomendada

```
segredos → tsc → eslint do projeto → knip → madge → jscpd → depcheck
         → npm audit → build → analyzer → axe
```

A varredura de segredos vem primeiro por ser barata e por ter a consequência
mais urgente: se ela achar algo, o usuário precisa saber antes do resto.

Barato antes de caro; o que informa o próximo antes do que depende dele. Se o
`tsc` já não passa, o resto ainda roda, mas o relatório precisa abrir com
isso — auditar refatoração num projeto que não compila é ordenar prioridade
errada.

## Limpeza

Ao terminar, apague qualquer script temporário que você criou (`.audit/axe-run.mjs`,
`/tmp/rn.bundle`). Em `.audit/` ficam apenas `findings.json`, `baseline.json`,
`convencoes.md` e os relatórios HTML. Sugira ao usuário adicionar
`.audit/relatorio-*.html` ao `.gitignore` se ele não quiser versionar os
relatórios — o `findings.json` e o `baseline.json` valem versionar.

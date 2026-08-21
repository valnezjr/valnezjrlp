# Priorização de leitura

Auditar 300 arquivos raso é pior do que auditar 40 a fundo. Esta é a conta
que decide quais 40.

As ferramentas passam em **tudo** — elas são baratas. A leitura por LLM, que
é cara, vai só para o topo deste ranking.

## Os três sinais

### Volatilidade — o que muda muito

```bash
git log --since='6 months ago' --format= --name-only \
  | grep -E '\.(tsx|jsx|ts|js)$' \
  | sort | uniq -c | sort -rn | head -60
```

Arquivo que recebeu 30 commits em 6 meses é onde o time trabalha de verdade.
Um defeito ali será encontrado, será custeado e será multiplicado pela
próxima pessoa que copiar o padrão dali.

Repo sem histórico git (ou raso, `--depth 1`): pule este sinal e diga isso
nos limites do relatório. Sem volatilidade, o ranking fica bem mais fraco.

### Grau de entrada — o que muitos importam

```bash
npx madge --extensions ts,tsx,js,jsx --json src \
  2>/dev/null > /tmp/madge.json
```

`madge` devolve o grafo; conte quantas vezes cada arquivo aparece como
dependência de outros. Alternativa sem madge, mais grosseira porém suficiente:

```bash
grep -rhoE "from ['\"][^'\"]+['\"]" src --include='*.tsx' --include='*.ts' \
  | sort | uniq -c | sort -rn | head -60
```

O arquivo que 40 módulos importam propaga qualquer defeito por 40 caminhos.

### Proximidade de entrypoint

Distância no grafo até a rota/tela mais próxima (do recon). Distância 0 e 1
sobem. Providers de topo contam como distância 0 — todo render passa por eles.

## Fórmula

```
score = 0.4 × norm(volatilidade)
      + 0.4 × norm(grau_de_entrada)
      + 0.2 × proximidade        // 1.0 em distância 0-1, 0.5 em 2, 0.2 acima
```

`norm` é min-max sobre o repo inteiro. Os pesos favorecem volatilidade e
alcance de propósito: proximidade de rota já está parcialmente embutida no
grau de entrada, então pesa menos para não contar duas vezes.

## Quantos arquivos ler

| Escala do repo | Leitura profunda |
|---|---|
| até 60 arquivos | todos |
| 60–200 | top 40 |
| 200–600 | top 60 |
| acima de 600 | top 60 + os entrypoints todos |

Sempre inclua no conjunto, independente do score:

- todos os entrypoints (rotas, telas, `layout`, `_app`, `App.tsx`)
- todos os providers de topo
- os arquivos que qualquer ferramenta já sinalizou com severidade alta —
  se `knip`/`madge`/ESLint apontou, vale confirmar com leitura

## Sempre fora

- `node_modules`, `dist`, `build`, `.next`, `.expo`, `coverage`, `out`
- `*.test.*`, `*.spec.*`, `__tests__/`, `__mocks__/` — auditoria de teste é
  outro trabalho, com outros critérios
- `*.d.ts` gerados, `*.generated.*`, `*.gen.ts`
- arquivos declarados como gerados no `.audit/convencoes.md`
- snapshots, fixtures, `*.stories.*` (a menos que o eixo seja a11y — story
  costuma ser onde o componente é exercitado de verdade)

## O que declarar

O relatório precisa dizer, textualmente: **"lidos a fundo N de M arquivos;
os outros passaram apenas pelas ferramentas"**, com a lista dos N. Sem isso o
leitor não tem como saber se o silêncio sobre um arquivo significa "está bom"
ou "não foi olhado" — e essa diferença é a diferença entre uma auditoria e um
palpite.

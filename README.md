# valnezjr — landing page pessoal

Landing page de serviços, sem scroll, 100% da viewport, navbar flutuante como header e seções que funcionam como "páginas" trocadas com fade sob o header. React + Vite + TypeScript + Tailwind CSS (só layout) + [mothership-ds](https://github.com/valnezjr/mothership-ds) (biblioteca de componentes padrão).

**Preview de desenvolvimento:** [valnezjr.github.io/valnezjrlp](https://valnezjr.github.io/valnezjrlp/) — atualiza a cada push em `main`. Não é a hospedagem final, só onde acompanhar o progresso.

## Documentos do projeto

- [`CLAUDE.md`](docs/CLAUDE.md) — regras de arquitetura e convenções.
- [`docs/prd.md`](docs/prd.md) — objetivo, conteúdo de cada seção, critérios de aceite.
- [`docs/architecture.md`](docs/architecture.md) — stack, estrutura de pastas, registro de decisões.
- [`docs/roteiro-prompts-landing-page.md`](docs/roteiro-prompts-landing-page.md) — roteiro de desenvolvimento passo a passo.

## Desenvolvimento

```bash
npm install
npm run dev       # servidor local
npm run build     # build de produção (tsc -b && vite build)
npm run lint       # oxlint
npm run preview   # serve o build de dist/ localmente
```

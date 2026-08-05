# Roteiro de Prompts — Landing Page (React + Vite + mothership-ds)

> **Nota (pós-Etapa 2):** o projeto começou com shadcn/ui como biblioteca de
> componentes (Etapas 1–2 originais). Decisão revista depois: **mothership-ds**
> (github.com/valnezjr/mothership-ds, biblioteca própria do autor) virou a
> biblioteca padrão do projeto **de agora em diante**, substituindo shadcn/ui
> por completo — ver `docs/architecture.md` § Registro de decisões. As etapas
> abaixo já refletem essa troca; se você reler commits antigos, vai ver
> shadcn/ui neles — é esperado.

Landing page de serviços, sem scroll, 100% da viewport, navbar flutuante como header e seções que funcionam como "páginas" trocadas com fade sob o header.

**Como usar este roteiro:** dê um prompt por vez ao Claude Code, na ordem. Confira o resultado no navegador antes de passar ao próximo. Se algo sair errado, corrija ainda dentro daquela etapa antes de avançar — é muito mais barato do que corrigir três etapas depois.

**Dica:** para as etapas 1 e 2, vale iniciar com o modo de planejamento do Claude Code (`Shift+Tab` para alternar até "plan mode") e aprovar o plano antes da execução.

---

## Etapa 0 — Instalar os documentos do projeto

Você já tem três documentos prontos na pasta `landing-page-docs`. Depois que a Etapa 1 criar o projeto, copie-os para dentro dele:

- `CLAUDE.md` → **raiz do projeto**. Regras permanentes que o Claude Code lê automaticamente a cada sessão.
- `prd.md` → **`docs/`**. O quê: objetivo, conteúdo de cada seção, critérios de aceite. **Preencha os campos entre [colchetes] antes das etapas 4–7.**
- `architecture.md` → **`docs/`**. O como: estrutura de pastas, navegação por estado, regras do layout sem scroll.

Depois de copiar, dê este prompt para garantir que tudo foi absorvido:

```
Leia CLAUDE.md, docs/prd.md e docs/architecture.md. Resuma em poucas linhas as regras que vai seguir e me avise se encontrar alguma contradição entre os documentos.
```

> A regra de "não hardcodar cores" (no CLAUDE.md) é o que vai permitir aplicar seu styleguide depois trocando só as variáveis do tema, sem reescrever componentes.

---

## Etapa 1 — Setup do projeto

```
Crie um novo projeto React com Vite e TypeScript neste diretório. Configure:

1. Tailwind CSS integrado ao Vite (só pra layout/posicionamento — cor e tipografia vêm do mothership-ds, nunca de tokens Tailwind).
2. mothership-ds como dependência: `"mothership-ds": "github:valnezjr/mothership-ds#<tag>"` no package.json — presa a uma tag, não à branch `main`. Importe `mothership-ds/styles.css` uma vez no `main.tsx`, e aplique a classe `ms-page` no `#root` (`index.html`) pra herdar cor/fonte/foco do design system.
3. Estrutura de pastas: src/sections/ (vazia por enquanto), src/components/, src/lib/, e docs/ na raiz (vazia — vou colocar os documentos do projeto nela).
4. Limpe o boilerplate do Vite (logos, CSS de exemplo, contador).
5. No CSS global: html, body e #root com height 100%, overflow hidden, e nenhuma margem — a aplicação nunca deve ter scroll. Cuidado com `.ms-page`'s `min-height: 100vh` competindo com isso no mobile (ver `index.css` atual pra receita).

Rode o dev server ao final e confirme que compila sem erros.
```

---

## Etapa 2 — Shell da aplicação (layout sem scroll + navegação por estado)

Esta é a etapa mais importante — é o esqueleto de tudo.

```
Implemente o shell da aplicação:

1. Crie um contexto ou estado no App para a seção ativa: "home" | "servicos" | "sobre" | "contato". Inicial: "home".
2. Layout raiz: um container de exatamente 100dvh por 100vw (usar dvh, não vh, por causa da barra de endereço no mobile), overflow hidden, display flex column.
3. Navbar flutuante: posição fixa no topo, centralizada, com margem do topo e das laterais (efeito "flutuando" — cantos arredondados, fundo translúcido com backdrop-blur, borda sutil e sombra leve). Contém: logo/nome à esquerda e os links das 4 seções à direita. O link da seção ativa deve ter destaque visual.
4. Área de conteúdo: ocupa todo o restante da viewport SOB a navbar (a navbar sobrepõe o conteúdo, então cada seção deve ter padding-top suficiente para nada ficar escondido atrás dela).
5. Crie as 4 seções em src/sections/ apenas como placeholders: cada uma ocupa 100% da área de conteúdo e mostra o nome da seção centralizado.
6. Clicar num link da navbar troca a seção ativa (por enquanto sem animação — a transição vem na próxima etapa).

Nenhuma seção pode gerar scroll. Se o conteúdo de uma seção exceder a viewport, é a seção que deve se adaptar, nunca criar scroll.
```

---

## Etapa 3 — Transição de fade entre seções

```
Adicione a transição de fade entre as seções:

1. Ao trocar de seção: a atual faz fade-out (opacidade 1 → 0), e só então a nova monta e faz fade-in (0 → 1). Duração total em torno de 400–500ms, com easing suave (ease-in-out).
2. Durante a transição, bloqueie novos cliques de navegação para não quebrar a animação.
3. Um leve deslocamento vertical (uns 8px subindo no fade-in) fica elegante — adicione, mas discreto.
4. Adicione também suporte à navegação por teclado: setas esquerda/direita trocam para a seção anterior/seguinte, na ordem da navbar.
5. Respeite prefers-reduced-motion: se o usuário tiver essa preferência, troca instantânea sem animação.

Pode usar apenas CSS transitions + estado do React, ou a lib motion (framer-motion) com AnimatePresence se ficar mais limpo — você decide, mas justifique a escolha.
```

---

## Etapa 4 — Seção Home / Hero

> Antes das etapas 4–7: preencha os `[colchetes]` da seção 5 do `docs/prd.md` com seu conteúdo real. Texto real converte melhor que placeholder.

```
Implemente a seção Home (hero), substituindo o placeholder, conforme a seção 5.1 do docs/prd.md.

- Os CTAs navegam usando a navegação por estado existente (primário → Contato, secundário → Serviços).
- A seção inteira cabe na viewport sem scroll em qualquer tamanho de tela; no mobile o visual de apoio pode sumir ou ir para o fundo.
- Usar Button do mothership-ds para os CTAs; hierarquia tipográfica forte (`.ms-h1`/`.ms-h2` no título, `.ms-text-muted` no subtítulo).
```

---

## Etapa 5 — Seção Serviços

```
Implemente a seção Serviços, substituindo o placeholder, conforme a seção 5.2 do docs/prd.md.

- Grid de cards (Card do mothership-ds), um por serviço, com os ícones do lucide-react indicados no PRD.
- Hover sutil nos cards (elevação/borda).
- No desktop: grid. No tablet: 2 colunas. No mobile: como a página não pode ter scroll, os cards viram um carrossel horizontal (Carousel do mothership-ds) ou empilham em versão compacta — escolha o que couber melhor na viewport, explique a escolha e registre-a no docs/architecture.md.

Tudo precisa caber em 100% da viewport, sem scroll, inclusive no mobile.
```

---

## Etapa 6 — Seção Sobre / Portfólio

```
Implemente a seção Sobre/Portfólio, substituindo o placeholder, conforme a seção 5.3 do docs/prd.md.

- Lado esquerdo (Sobre): Avatar e Badges do mothership-ds pras competências do PRD, parágrafo de apresentação.
- Lado direito (Portfólio): projetos em miniatura (imagem/placeholder + nome + uma linha); clique abre um Modal do mothership-ds com os detalhes do PRD — assim o portfólio ganha profundidade sem quebrar a regra de não ter scroll na página.

No mobile: empilhar com o portfólio como carrossel horizontal compacto. Sempre cabendo na viewport.
```

---

## Etapa 7 — Seção Contato

```
Implemente a seção Contato, substituindo o placeholder, conforme a seção 5.4 do docs/prd.md.

- Formulário (Field/Input/Textarea/Button do mothership-ds): nome, e-mail, mensagem.
  - Validação client-side simples (campos obrigatórios, formato de e-mail).
  - Por enquanto sem backend: ao enviar, mostrar estado de sucesso (ícone + mensagem) e limpar o formulário. A função de envio fica isolada em lib/sendContact.ts, conforme o docs/architecture.md, para eu plugar o serviço real depois.
- Ao lado do formulário, os contatos diretos listados no PRD, com ícones do lucide-react.

Formulário compacto o suficiente para caber na viewport com teclado fechado no mobile.
```

---

## Etapa 8 — Responsividade e revisão de qualidade

```
Faça uma revisão completa da aplicação:

1. Teste os breakpoints 360px, 768px, 1024px, 1440px e 1920px de largura, e também altura baixa (ex.: 1366x600, notebook com navegador com barras). Nenhuma combinação pode gerar scroll nem conteúdo cortado/escondido atrás da navbar.
2. No mobile, a navbar deve virar um menu: logo + botão hamburguer que abre um Drawer do mothership-ds com os links das seções.
3. Acessibilidade: navegação por Tab funcionando em ordem lógica, foco visível, aria-current na seção ativa da navbar, textos alternativos, contraste adequado.
4. Título da aba e meta description apropriados; lang="pt-BR" no html.
5. Rode o build de produção (npm run build) e corrija qualquer erro ou warning.
6. Confira um a um os critérios de aceite da seção 7 do docs/prd.md.

Liste tudo o que encontrou e corrigiu.
```

---

## Etapa 9 — Styleguide (superada — mothership-ds já é o styleguide)

> Escopo original: "aplicar o styleguide depois, só via tema". Ficou obsoleto
> quando o mothership-ds virou a biblioteca de componentes em si (não só uma
> fonte de tokens) — o styleguide já está aplicado desde a integração, não é
> mais um passo futuro. O que sobra desta etapa, pra quando fizer sentido:

```
Puxe a versão mais nova do mothership-ds: atualize a tag em "mothership-ds" no
package.json (github:valnezjr/mothership-ds#<tag nova>) e rode npm install.
Depois disso, revise se algum componente novo da lib substitui algo que hoje
está implementado à mão no projeto (conferir docs/architecture.md § Registro
de decisões e o styleguide publicado em valnezjr.github.io/mothership-ds/).
```

- **Logo:** trocar o texto "valnezjr" da navbar (`Navbar.tsx`, dentro de `.ms-navbar__brand`) por um arquivo de logo, quando houver um pronto.
- **Ajuste de tema pontual** (se algum dia quiser divergir do tema padrão do mothership-ds só pra este projeto): editar as variáveis em `node_modules/mothership-ds/src/styles/tokens.css` não é opção (fica em `node_modules`, some no próximo `npm install`) — a rota certa seria um override CSS local depois dos imports em `index.css`, redeclarando só as `--color-*`/`--font-family` que quiser mudar. Ainda não foi necessário.

---

## Extras (opcionais, para depois do essencial pronto)

- ~~**Deploy:** `Configure o projeto para deploy na Vercel/Netlify e me diga o passo a passo para publicar.`~~
  Feito diferente do sugerido: preview de desenvolvimento no GitHub Pages
  (`valnezjr.github.io/valnezjrlp/`, deploy automático a cada push em
  `main` via `.github/workflows/pages.yml`) — não é a hospedagem final,
  só onde acompanhar o progresso enquanto o site evolui. Decisão
  registrada em `architecture.md` § Registro de decisões. Vercel/
  Netlify/domínio próprio continuam opção pra quando decidir o destino
  definitivo.
- **Indicador de navegação:** `Adicione dots/indicador discreto na lateral ou rodapé mostrando qual das 4 seções está ativa, clicáveis.`
- **Navegação por roda do mouse:** `Adicione troca de seção via scroll do mouse (com debounce para trocar apenas uma seção por gesto), mantendo o fade.`
- **SEO/Open Graph:** `Adicione meta tags Open Graph e favicon para compartilhamento em redes sociais.`

---

## Armadilhas conhecidas deste tipo de layout (para você fiscalizar)

1. **`100vh` no mobile** — a barra de endereço do navegador faz `100vh` estourar a tela. O roteiro já exige `100dvh`; se vir scroll no celular, é quase sempre isso.
2. **Conteúdo escondido atrás da navbar** — como ela flutua sobre o conteúdo, toda seção precisa de padding-top. Verifique especialmente títulos das seções.
3. **"Sem scroll" x conteúdo demais** — a restrição de viewport única força escolhas: menos texto, carrosséis e dialogs no lugar de listas longas. Se uma seção não couber, corte conteúdo em vez de deixar o Claude Code "dar um jeito" com fontes minúsculas.
4. **Altura baixa em desktop** — todo mundo testa largura, quase ninguém testa altura. Notebook 1366x768 com barras do navegador sobra ~600px úteis; a etapa 8 cobre isso, não pule.

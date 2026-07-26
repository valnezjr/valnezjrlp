# Architecture — Landing Page de Serviços

> Fonte da verdade sobre **como** o site é construído.
> Conteúdo e requisitos: ver `prd.md`. Convenções de código: ver `CLAUDE.md`.

## 1. Stack

- **React 18 + Vite + TypeScript** — SPA simples, sem SSR (não há necessidade de SEO multi-página numa landing one-page).
- **Tailwind CSS + shadcn/ui** — componentes copiados para o repo (não é dependência de runtime), tema via CSS variables.
- **lucide-react** — ícones.
- **motion (framer-motion)** — [ou "CSS transitions puras"] para o fade entre seções. Decisão registrada na etapa de transições.

## 2. Estrutura de pastas

```
src/
├── App.tsx              # Shell: estado de navegação + layout raiz
├── index.css            # Tema (CSS variables do shadcn), reset, regra de no-scroll
├── main.tsx
├── components/
│   ├── ui/              # Componentes shadcn (gerados, não editar à mão sem motivo)
│   ├── Navbar.tsx       # Navbar flutuante (desktop) + Sheet (mobile)
│   └── SectionShell.tsx # Wrapper comum: padding-top p/ navbar, fade, 100% da área útil
├── sections/
│   ├── Home.tsx
│   ├── Servicos.tsx
│   ├── Sobre.tsx
│   └── Contato.tsx
└── lib/
    ├── utils.ts         # cn() do shadcn
    └── content.ts       # [opcional] textos centralizados, espelhando o prd.md
```

## 3. Navegação — decisão central

**Sem react-router.** A navegação é por estado:

```ts
type SectionId = "home" | "servicos" | "sobre" | "contato";
// App mantém: const [active, setActive] = useState<SectionId>("home")
```

- Uma seção montada por vez, renderizada sob a navbar.
- **Por quê:** não há URLs distintas a preservar, não há SSR, e rotas reais criariam
  complexidade (scroll restoration, history) sem benefício numa página única.
- Trade-off aceito: sem deep-linking por URL. [Se quiser deep-link depois:
  sincronizar `active` com `location.hash` — mudança pequena e isolada no App.]
- Ordem canônica das seções (para navegação por setas): home → servicos → sobre → contato.

## 4. Layout sem scroll — regras invioláveis

1. Container raiz: `100dvw` x `100dvh` (**dvh, nunca vh** — barra de endereço mobile), `overflow: hidden` em html/body/#root.
2. Navbar: `position: fixed`, flutuante (margens, cantos arredondados, backdrop-blur), sobrepõe o conteúdo.
3. Toda seção usa o `SectionShell`, que já aplica o padding-top compensando a navbar — seções nunca calculam isso individualmente.
4. Se o conteúdo não cabe: adaptar o conteúdo (carrossel, dialog, corte de texto). **Nunca** criar scroll interno ou reduzir fonte abaixo do legível.

## 5. Transições

- Fade-out da seção atual → troca → fade-in da nova (total 400–500ms, ease-in-out, com deslocamento sutil de ~8px no fade-in).
- Navegação bloqueada durante a transição (evita estados intermediários quebrados).
- `prefers-reduced-motion`: troca instantânea.

## 6. Tema e styleguide (futuro)

- Todo estilo de cor/tipografia passa pelas CSS variables do shadcn (`--background`, `--primary`, etc.) definidas em `index.css`.
- Componentes usam **apenas** classes semânticas (`bg-background`, `text-muted-foreground`...).
- Aplicar o styleguide futuro = editar `index.css` + config de fontes. Zero mudança em componentes. Esta é a razão da proibição de cores hardcoded no CLAUDE.md.

## 7. Formulário de contato

- v1: validação client-side, envio simulado com estado de sucesso.
- A função de envio fica isolada (ex.: `lib/sendContact.ts`) para plugar [Formspree/EmailJS/API] sem tocar no componente.

## 8. Registro de decisões

| # | Decisão | Motivo | Data |
|---|---|---|---|
| 1 | SPA sem router, navegação por estado | Página única, sem necessidade de URLs | [data] |
| 2 | dvh em vez de vh | Barra de endereço mobile quebra 100vh | [data] |
| 3 | shadcn/ui + tokens semânticos | Styleguide futuro aplicável só via tema | [data] |
| 4 | [preencher conforme o projeto evoluir] | | |

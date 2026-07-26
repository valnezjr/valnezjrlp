# PRD — Landing Page de Serviços

> Fonte da verdade sobre **o que** o site é e **o que** cada seção contém.
> O Claude Code deve consultar este arquivo ao implementar qualquer seção.
> Estrutura técnica: ver `architecture.md`. Convenções de código: ver `CLAUDE.md`.

## 1. Objetivo

Divulgar os serviços de [seu nome / sua marca] e converter visitantes em contato direto (formulário ou WhatsApp).

**Métrica de sucesso:** visitante entende o que ofereço em menos de 10 segundos e tem no máximo 2 cliques até me contatar.

## 2. Público-alvo

- [quem contrata você — ex.: pequenos negócios locais que precisam de presença digital]
- [segundo perfil, se houver — ex.: startups que precisam de MVP]

## 3. Proposta de valor

[Uma frase: por que contratar você e não outro? Ex.: "Entrego sites rápidos e bonitos em semanas, não meses, com comunicação direta e sem intermediários."]

## 4. Requisitos de produto

- Página única, sem scroll, 100% da viewport, em pt-BR.
- 4 seções navegáveis como "páginas": Home, Serviços, Sobre/Portfólio, Contato.
- Navbar flutuante sempre visível; seção ativa destacada.
- Transição fade entre seções (400–500ms), respeitando prefers-reduced-motion.
- Funcional de 360px a 1920px de largura, incluindo alturas baixas (~600px úteis).
- Formulário de contato com validação client-side; envio real plugado depois via [Formspree / EmailJS / API própria].

## 5. Conteúdo por seção

### 5.1 Home / Hero
- **Título:** [ex.: "Sites e sistemas que fazem seu negócio crescer"]
- **Subtítulo:** [1–2 linhas: o que você faz e para quem]
- **CTA primário:** "[Fale comigo]" → seção Contato
- **CTA secundário:** "[Ver serviços]" → seção Serviços
- **Visual de apoio:** [descreva, ou "placeholder abstrato em CSS/SVG"]

### 5.2 Serviços
- **Título da seção:** [ex.: "O que eu faço"]
- **Serviços:**
  | Serviço | Descrição (1–2 linhas) | Ícone (lucide) |
  |---|---|---|
  | [Serviço 1] | [descrição] | [ex.: globe] |
  | [Serviço 2] | [descrição] | [ex.: smartphone] |
  | [Serviço 3] | [descrição] | [ex.: rocket] |

### 5.3 Sobre / Portfólio
- **Apresentação:** [parágrafo curto: quem você é, experiência, diferencial]
- **Competências (badges):** [React, Node, UX, ...]
- **Projetos (3–4):**
  | Projeto | Uma linha | Detalhe (abre no dialog) |
  |---|---|---|
  | [Projeto 1] | [resumo] | [contexto, resultado, link se houver] |
  | [Projeto 2] | [resumo] | [...] |

### 5.4 Contato
- **Título:** [ex.: "Vamos conversar?"]
- **Formulário:** nome, e-mail, mensagem (todos obrigatórios).
- **Contatos diretos:** [WhatsApp wa.me/55..., e-mail, LinkedIn, Instagram]

## 6. Fora de escopo (v1)

- Blog, múltiplas páginas/rotas, CMS, i18n, dark mode toggle [ajuste se quiser algum].
- Backend próprio de e-mail (entra depois).

## 7. Critérios de aceite globais

1. Nenhuma resolução testada gera scroll ou conteúdo cortado/atrás da navbar.
2. Todas as seções acessíveis por navbar, teclado (setas e Tab) e leitores de tela.
3. Build de produção sem erros nem warnings.
4. Nenhuma cor hex hardcoded em componente (só tokens do tema).

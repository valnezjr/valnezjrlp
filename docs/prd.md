# PRD — Landing Page de Serviços

> Fonte da verdade sobre **o que** o site é e **o que** cada seção contém.
> O Claude Code deve consultar este arquivo ao implementar qualquer seção.
> Estrutura técnica: ver `architecture.md`. Convenções de código: ver `CLAUDE.md`.

## 1. Objetivo

Divulgar os serviços de Valnez Júnior, Designer Engineer, e converter visitantes em contato direto (formulário ou WhatsApp).

**Métrica de sucesso:** visitante entende o que ofereço em menos de 10 segundos e tem no máximo 2 cliques até me contatar.

## 2. Público-alvo

- Negócios locais da região, contratando como profissional independente.
- Empresas de pequeno/médio porte de tecnologia, contratando como prestador de serviço terceirizado.

## 3. Proposta de valor

"Do componente ao sistema, dos tokens à identidade visual finalizada — projeto completo, acessível e de qualidade para a sua marca."

## 4. Requisitos de produto

- Página única, sem scroll, 100% da viewport, em pt-BR.
- 4 seções navegáveis como "páginas": Home, Serviços, Sobre/Portfólio, Contato.
- Navbar flutuante sempre visível; seção ativa destacada.
- Transição fade entre seções (400–500ms), respeitando prefers-reduced-motion.
- Funcional de 360px a 1920px de largura, incluindo alturas baixas (~600px úteis).
- Formulário de contato com validação client-side; envio real plugado depois via [Formspree / EmailJS / API própria].

## 5. Conteúdo por seção

### 5.1 Home / Hero
- **Título:** "Do componente ao sistema, da marca ao produto."
- **Subtítulo:** Valnez Júnior, Designer Engineer — projetos completos, acessíveis e com identidade, para negócios locais e empresas de tecnologia.
- **CTA primário:** "Fale comigo" → seção Contato
- **CTA secundário:** "Ver serviços" → seção Serviços
- **Visual de apoio:** placeholder abstrato em CSS/SVG (nada definido ainda)

> Título/subtítulo acima são rascunho de copy, derivados da proposta de valor (§3) — ajuste à vontade antes da Etapa 4.

### 5.2 Serviços
- **Título da seção:** "O que eu faço"
- **Categorias** (cada card abre um Modal com a descrição completa + subitens):

  | Categoria | Descrição (1–2 linhas) | Subitens | Ícone (lucide) |
  |---|---|---|---|
  | Digital Design | Produtos digitais pensados de ponta a ponta — da interface ao sistema que sustenta tudo. | UI/UX Design, Product Design, Design System | `monitor-smartphone` |
  | Brand Design | Identidade visual completa, do conceito à aplicação em cada ponto de contato da marca. | Branding, Identidade Visual | `palette` |
  | Print | Peças físicas com o mesmo cuidado do digital, prontas pra produção. | Design de Embalagem, Peças Gráficas | `printer` |

> Reorganização pedida em 2026-08-05: de 3 serviços soltos (Brand Design, UI/UX Design, Product Design) pra 3 categorias com subitens. Descrições e nomes dos subitens em português são rascunho meu a partir do que você passou em inglês ("Digital Design (UI/UX, Product Design, Design System), Brand Design (Branding, Visual Identity), Print (Packaging Design, Print Design)") — mantive nomes de disciplina consolidados em inglês (UI/UX Design, Product Design, Design System, Branding, Digital Design, Brand Design, Print — já eram assim antes) e traduzi só os subitens que soam mais naturais em português (Visual Identity → Identidade Visual, Packaging Design → Design de Embalagem, Print Design → Peças Gráficas). Revise à vontade.

### 5.3 Sobre / Portfólio
- **Apresentação:** _[PENDENTE — Valnez ainda está organizando esse conteúdo, revisitar este tópico antes da Etapa 6]_
- **Competências (badges):** _[PENDENTE]_
- **Projetos (3–4):** _[PENDENTE — inclui decidir se o portfólio fica nesta tabela estática ou é buscado dinamicamente do GitHub (`Sobre.tsx` já tem uma nota nesse sentido); se for GitHub, falta o username e o critério de filtro]_

### 5.4 Contato
- **Título:** "Vamos conversar?"
- **Formulário:** nome, e-mail, mensagem (todos obrigatórios).
- **Contatos diretos:** WhatsApp [wa.me/5584996324823](https://wa.me/5584996324823) (+55 84 99632-4823), e-mail valn3zjr@gmail.com. LinkedIn/Instagram: não informado — adicionar depois se quiser expor.

## 6. Fora de escopo (v1)

- Blog, múltiplas páginas/rotas, CMS, i18n, dark mode toggle [ajuste se quiser algum].
- Backend próprio de e-mail (entra depois).

## 7. Critérios de aceite globais

1. Nenhuma resolução testada gera scroll ou conteúdo cortado/atrás da navbar.
2. Todas as seções acessíveis por navbar, teclado (setas e Tab) e leitores de tela.
3. Build de produção sem erros nem warnings.
4. Nenhuma cor hex hardcoded em componente (só tokens do tema).

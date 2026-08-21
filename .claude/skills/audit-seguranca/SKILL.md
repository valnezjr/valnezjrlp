---
name: audit-seguranca
description: Audita segurança de projetos React e React Native — segredos vazados para o bundle ou versionados, XSS via HTML injetado, dependências com vulnerabilidade conhecida, armazenamento inseguro de token, route handlers e server actions do Next sem validação ou sem checagem de autorização, deep links e WebView no React Native, cookies e sessão. Use quando o pedido for "auditar segurança", "tem vulnerabilidade aqui?", "revisar brechas", "isso está seguro?", ou quando a skill audit-frontend delegar este eixo. Auditoria defensiva: identifica e corrige. Não escreve exploits, não testa sistemas em produção e não faz pentest.
---

# Audit Segurança

Auditoria **defensiva** de front-end: encontrar o que está exposto para que
seja fechado.

## Limites que esta skill não cruza

Estes não são detalhes de etiqueta — são o que separa auditoria de ataque:

- **Não escreve exploit nem prova de conceito executável.** Descrever o
  mecanismo de uma falha e como corrigi-la é o trabalho; entregar código que a
  explora não é.
- **Não testa contra sistema em produção nem contra terceiros.** A auditoria é
  leitura de código e execução de ferramentas locais. Nada de requisição a um
  alvo real para "confirmar" a falha.
- **Não é pentest e não substitui um.** Sem análise dinâmica, sem teste de
  autenticação real, sem fuzzing. O relatório precisa dizer isso.
- **Não faz auditoria de backend.** Se o projeto tem API própria fora do Next,
  ela está fora do escopo — diga isso em vez de fingir cobertura.

## O cuidado com o próprio relatório

Este é o único eixo em que a auditoria pode **criar** um problema de segurança.

Ao encontrar um segredo real (chave de API, token, senha, string de conexão):

1. **Nunca escreva o valor no `findings.json`, no relatório ou na conversa.**
   Use `evidencia` com o valor mascarado: `AKIA****************` ou
   `sk_live_…` com o sufixo cortado.
2. Registre **onde** está (arquivo e linha) e **que tipo** de credencial é.
3. Diga no `correcao` que a chave precisa ser **rotacionada**, não apenas
   removida — uma chave que já esteve num arquivo deve ser considerada
   comprometida.
4. Se o segredo estiver em arquivo versionado, avise o usuário **na conversa,
   imediatamente**, sem esperar o fim da auditoria.

O relatório HTML é um arquivo comum, que pode ser compartilhado. Trate-o como
público.

## Entrada e saída

Recebe `stack`, `convencoes`, `arquivosPrioritarios`, `raiz`. Devolve **apenas**
um array JSON no formato de `audit-frontend/references/finding-format.md`, com
`eixo: "seguranca"`. Sem prosa, sem arquivo escrito.

Diferença importante em relação aos outros eixos: **este não se limita aos
`arquivosPrioritarios`.** Uma chave vazada num arquivo que ninguém edita há
dois anos vale tanto quanto uma no arquivo mais quente do repo. As varreduras
mecânicas (segredos, dependências, padrões perigosos) passam em **todo** o
código-fonte; a leitura dirigida é que respeita a priorização.

## Ordem de trabalho

### 1. Segredos — sempre primeiro

É o achado de maior impacto e o de confirmação mais rápida.
[references/segredos.md](references/segredos.md).

Escopo padrão: **estado atual do repositório**. Varredura do histórico do git é
modo opcional, acionado só a pedido — está descrita no mesmo arquivo, com a
ressalva de custo.

### 2. Dependências vulneráveis

```bash
npm audit --json                      # ou: pnpm audit --json / yarn npm audit
npx --yes osv-scanner@latest scan source ./    # segunda opinião, base OSV
```

Ler o resultado do `npm audit` exige critério — a saída crua é famosa por
inflar. Três filtros antes de virar finding:

- **`devDependencies` só entram** se a falha for de execução em build ou CI
  (typosquatting, script malicioso, RCE em ferramenta de build). Falha numa
  dependência de teste não chega ao usuário.
- **Vulnerabilidade em código que o projeto não executa** (uma função da lib
  que nunca é chamada) é `media`, não `alta`. Confirme se o caminho vulnerável
  é alcançável antes de subir a severidade.
- **Advisory sem correção disponível** ainda é finding, mas com `correcao`
  honesta: mitigação, ou substituição da lib, não "atualize".

Sempre cite o identificador (`CVE-…`, `GHSA-…`) em `referencia`.

### 3. Varredura de padrões perigosos

```bash
# HTML injetado
grep -rn "dangerouslySetInnerHTML\|innerHTML\s*=" src --include='*.tsx' --include='*.ts'
# execução dinâmica
grep -rn "\beval(\|new Function(\|setTimeout(\s*['\"]" src
# destino de navegação vindo de dado
grep -rn "window.location\s*=\|location.href\s*=\|window.open(" src
# armazenamento no navegador
grep -rn "localStorage\|sessionStorage\|document.cookie" src
# React Native
grep -rn "AsyncStorage\|WebView\|Linking.openURL\|allowFileAccess" src
```

Cada ocorrência é candidata, não achado. O que decide é a **origem do dado**:
se ele pode vir do usuário, da URL, de uma API ou de um deep link, é finding;
se é constante do próprio código, não é.

### 4. Leitura dirigida

- Front-end: [references/web.md](references/web.md)
- Camada server do Next: [references/next-server.md](references/next-server.md)
- React Native: [references/react-native.md](references/react-native.md)
- Auth e sessão: [references/auth-sessao.md](references/auth-sessao.md)

## Severidade neste eixo

A escala geral de `audit-frontend/references/severidade.md` vale, com uma
tradução própria — aqui a consequência é exposição, não lentidão:

| Nível | Critério |
|---|---|
| `critica` | Explorável hoje, sem pré-condição, com impacto direto: segredo válido exposto, XSS com dado de usuário, rota de dado sensível sem autorização no servidor |
| `alta` | Explorável com uma pré-condição plausível (usuário autenticado qualquer, link clicado, sessão obtida): autorização só no cliente, token em storage acessível a script, redirect aberto, dependência com CVE alcançável |
| `media` | Enfraquece a defesa sem ser explorável sozinho: cookie sem `SameSite`, CSP ausente ou permissiva, falta de validação onde o servidor ainda checa depois, dado sensível em log |
| `baixa` | Endurecimento: cabeçalho ausente sem vetor conhecido, versão defasada sem advisory, informação de stack em erro de desenvolvimento |

**Confiança importa mais aqui do que em qualquer outro eixo.** Um falso
positivo de segurança consome tempo caro e corrói a confiança no relatório
inteiro. Se você não confirmou que o dado chega no ponto perigoso, a
severidade não passa de `media` e a confiança é `media`.

## Achados que quase sempre valem

1. **Segredo em arquivo versionado ou em variável exposta ao cliente.**
   `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`, `VITE_*` são **públicos por construção** —
   uma chave privada ali está no bundle de todo visitante. `critica`.
2. **`dangerouslySetInnerHTML` com conteúdo que passa por dado de usuário ou
   de API.** `critica` se o conteúdo é editável por outro usuário.
3. **Token de sessão em `localStorage`.** Acessível a qualquer script na
   página — inclusive um injetado por dependência comprometida. `alta`.
4. **Autorização decidida só no cliente.** Rota escondida no menu, componente
   que não renderiza, `middleware` que só redireciona — sem checagem no
   servidor, o dado continua acessível pela API. `critica` para dado sensível.
5. **Server action ou route handler sem validação de entrada e sem checagem de
   quem chamou.** Server actions são endpoints públicos, não funções internas.
6. **Redirect aberto.** Destino vindo de query string sem lista de permissão.
7. **WebView com `javaScriptEnabled` carregando URL vinda de fora.**
8. **Deep link que executa ação sem confirmar origem nem sessão.**
9. **Dependência com advisory conhecido em caminho alcançável.**
10. **Dado sensível em log** — token, CPF, e-mail, corpo de resposta inteiro em
    `console.log` que sobrevive em produção.

## Anti-catálogo deste eixo

O ruído aqui é caro. Não são findings:

- Saída bruta do `npm audit` transcrita sem filtro.
- Vulnerabilidade em `devDependency` que não roda em build nem em CI.
- `dangerouslySetInnerHTML` com string literal do próprio código.
- Ausência de CSP, HSTS ou outro cabeçalho **quando eles são configurados na
  infraestrutura** (CDN, proxy, host) e não no código — verifique antes; se não
  der para verificar, é observação.
- `localStorage` guardando preferência de tema, filtro ou rascunho. Storage não
  é o problema; o que está guardado é.
- Recomendar uma biblioteca de segurança sem um vetor concreto.
- Repetir o mesmo padrão em N arquivos como N findings. Um finding, N
  ocorrências, uma correção.
- "Falta rate limiting" / "falta WAF" — infraestrutura, não código de
  front-end. Observação, no máximo.
- Chave **pública** por design (Firebase web config, chave publicável do
  Stripe, `anon key` do Supabase) reportada como vazamento. Confirme o tipo
  antes: reportar chave pública como incidente destrói a credibilidade do
  relatório.

## O que declarar nos limites

Sempre, sem exceção:

- Que a auditoria foi **estática**: leitura de código e ferramentas locais, sem
  teste dinâmico, sem pentest, sem verificação de que uma falha é de fato
  explorável em execução.
- Que o backend próprio (se houver, fora do Next) não foi auditado.
- Que a varredura de segredos cobriu o **estado atual** do repositório, não o
  histórico do git — e que um segredo removido num commit anterior continua
  recuperável até ser rotacionado.
- Quais ferramentas não puderam rodar e por quê.

## Interseções

- Dependência não usada que também tem CVE: a remoção é de `bundle-deps`, o
  risco é seu. Reporte o seu.
- `any` no payload de uma API que também some com a validação: a tipagem é de
  `clean-code`; a ausência de validação em fronteira de confiança é sua.
- Segredo hardcoded que também é config duplicada: é seu, e com prioridade.

# Segurança — front-end web

O que roda no navegador do usuário. Premissa que organiza tudo aqui:
**nada que chega ao cliente é confiável, e nada que está no cliente é
secreto.**

## XSS

### `dangerouslySetInnerHTML`

```bash
grep -rn "dangerouslySetInnerHTML" src app --include='*.tsx' --include='*.jsx'
```

Cada ocorrência: rastreie a origem do HTML.

| Origem | Veredito |
|---|---|
| String literal no próprio código | Não é finding |
| Markdown/CMS renderizado **com sanitização** (DOMPurify, `rehype-sanitize`) | Não é finding; confirme que a sanitização é aplicada, não apenas importada |
| Conteúdo de API própria, sem sanitização | `alta` — depende da API não ser comprometida |
| Conteúdo editável por outro usuário (comentário, perfil, mensagem) | `critica` — XSS armazenado |
| Conteúdo vindo de query string ou hash da URL | `critica` — XSS refletido |

**Cenário precisa nomear o caminho completo**: de onde o dado entra, por onde
passa, onde é injetado. "Pode causar XSS" não passa.

Correção padrão: sanitizar com DOMPurify no ponto de injeção, ou renderizar
como texto. Se o projeto precisa de HTML rico, a sanitização é obrigatória e a
lista de tags permitidas deve ser explícita.

### `innerHTML`, `outerHTML`, `insertAdjacentHTML`

Mesmo problema, fora do React. Comum em código de integração e em `useEffect`
que mexe no DOM direto.

### Execução dinâmica

```bash
grep -rn "\beval(\|new Function(\|setTimeout(\s*['\"]\|setInterval(\s*['\"]" src app
```

`eval` ou `new Function` sobre qualquer dado que não seja constante do código é
`critica`. `setTimeout("codigo")` com string é a mesma coisa disfarçada.

### `href` e `src` vindos de dado

```tsx
<a href={item.link}>          // ← item.link pode ser "javascript:..."
<iframe src={config.url}>
```

`javascript:` em `href` executa no clique. Valide o protocolo:

```ts
const seguro = /^https?:\/\//.test(url) ? url : "#";
```

`alta` quando a URL vem de conteúdo de usuário ou de API.

### `target="_blank"` sem `rel`

Navegadores modernos aplicam `noopener` por padrão, então isso deixou de ser
`alta`. Continua valendo como `baixa` em projeto que precisa suportar
navegador antigo — e não é finding num projeto que não precisa.

## Redirect aberto

```bash
grep -rn "window.location\s*=\|location.href\s*=\|location.replace(\|router.push(\|router.replace(" src app
```

O padrão perigoso é o destino vir de fora:

```tsx
const destino = searchParams.get("next");
router.push(destino);            // ← redirect aberto
```

Serve para phishing: o link parte do domínio legítimo e leva ao domínio do
atacante, e o usuário confere o domínio inicial, não o final.

Correção: lista de permissão de caminhos, ou aceitar apenas caminhos relativos
que comecem com `/` e não com `//` (que o navegador trata como protocolo
relativo, ou seja, outro domínio).

`alta` quando o parâmetro é controlável por link.

## Armazenamento no navegador

```bash
grep -rn "localStorage\|sessionStorage\|document.cookie\|indexedDB" src app
```

O que decide não é o mecanismo, é **o que está guardado**:

| Conteúdo | Veredito |
|---|---|
| Tema, filtro, rascunho, estado de UI | Não é finding |
| Token de sessão / JWT em `localStorage` | `alta` — qualquer script na página lê, incluindo um injetado por dependência comprometida |
| Dados pessoais (CPF, endereço, telefone) | `media` — persistem depois do logout, em máquina compartilhada |
| Chave de API | `critica` |

Detalhe que costuma faltar: **o logout limpa o que foi guardado?** Token
removido mas perfil e carrinho mantidos, numa máquina compartilhada, é `media`.

Correção para token: cookie `httpOnly` + `Secure` + `SameSite`. Ver
[auth-sessao.md](auth-sessao.md).

## Content Security Policy e cabeçalhos

Antes de reportar ausência, **verifique onde os cabeçalhos são definidos**.
Muitos projetos os configuram na CDN, no proxy ou no host (Vercel, Netlify,
Cloudflare), não no código. Reportar como ausente algo que existe uma camada
acima é ruído.

```bash
grep -rn "Content-Security-Policy\|headers()\|X-Frame-Options\|Strict-Transport" \
  next.config.* middleware.* vercel.json netlify.toml public/_headers 2>/dev/null
```

Se não houver nada e não der para verificar a infraestrutura, isso é
**observação**, não finding — e a observação deve dizer que a verificação da
camada de infra não foi possível.

Quando houver CSP definida no código, o que vale reportar:

- `unsafe-inline` em `script-src` — anula boa parte da proteção contra XSS.
  `media`.
- `unsafe-eval` em `script-src` — `media`; confirme se alguma dependência
  realmente exige (algumas libs de template e de gráficos exigem).
- `default-src *` ou `script-src *` — CSP decorativa. `media`.

Cabeçalhos que valem checar junto: `X-Content-Type-Options: nosniff`,
`Referrer-Policy`, `Strict-Transport-Security`, `X-Frame-Options` ou
`frame-ancestors`.

## `postMessage` e comunicação entre janelas

```bash
grep -rn "postMessage\|addEventListener(\"message\"" src app
```

Dois erros simétricos, os dois `alta` quando há dado sensível envolvido:

- **Enviar com `"*"` como destino**: `frame.postMessage(dados, "*")` entrega a
  qualquer origem que esteja no iframe.
- **Receber sem checar `event.origin`**: aceita mensagem de qualquer janela.

```ts
window.addEventListener("message", (e) => {
  if (e.origin !== "https://parceiro.exemplo.com") return;   // ← obrigatório
  …
});
```

## Dados sensíveis vazando pelo cliente

- **`console.log` com payload inteiro, token ou dado pessoal** que sobrevive em
  produção. `media`; `alta` se inclui credencial.
- **Objeto de usuário completo enviado ao cliente** quando a tela usa três
  campos — hash de senha, papel interno, flags e e-mails de terceiros junto.
  Em Next, é o caso clássico de props de server component. `alta` se inclui
  dado que o usuário não deveria ver.
- **Mensagem de erro com stack trace ou query SQL** exibida na UI de produção.
  `media`.
- **Source maps de produção publicados** — expõem o código-fonte original.
  Muitas vezes é decisão consciente (facilita depurar erro real); vira finding
  só se o código contiver lógica que não deveria ser lida. Observação, no
  geral.

## Formulários e entrada

- **Validação só no cliente** para regra que importa: o servidor precisa
  revalidar sempre. `alta` quando a regra é de autorização ou de valor
  (preço, quantidade, desconto).
- **Upload sem restrição de tipo e tamanho no servidor**. Checagem de extensão
  no cliente não é checagem.
- **`autoComplete="off"` em campo de senha** — atrapalha gerenciadores de
  senha e empurra o usuário para senhas piores. `baixa`, mas real.
- **Campo de senha sem `type="password"`**. `media`.

## Terceiros carregados na página

```bash
grep -rn "<script\|createElement(\"script\")" src app public/index.html 2>/dev/null
```

Script de terceiro (analytics, chat, tag manager) roda com todos os privilégios
da sua página: lê o DOM, o `localStorage` e os cookies não-`httpOnly`.

- Script externo **sem** `integrity` (SRI) num CDN de terceiro: `media`.
- Tag manager que permite injetar JS arbitrário por interface: observação —
  é decisão de produto, mas o relatório deve registrar que existe esse canal.
- Dependência de front-end abandonada que carrega recurso remoto em runtime:
  `alta`.

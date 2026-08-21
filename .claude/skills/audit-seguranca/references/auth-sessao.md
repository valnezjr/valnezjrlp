# Segurança — autenticação e sessão

Atravessa as outras três camadas. A pergunta que organiza o arquivo inteiro:

> **Onde mora a decisão de "essa pessoa pode ver isso"?**

Se a resposta é "no cliente", há finding, sem exceção. O cliente decide o que
**mostrar**; só o servidor pode decidir o que **entregar**.

## Autorização só no cliente

O defeito mais comum e o mais caro deste eixo. Três disfarces:

```tsx
{usuario.papel === "admin" && <PainelAdmin />}   // esconde a UI
```

```tsx
if (!sessao) redirect("/login");                  // redireciona a navegação
```

```tsx
const rotas = usuario.admin ? rotasAdmin : rotasComuns;   // filtra o menu
```

Nenhum dos três impede a requisição. O dado continua a uma chamada de API de
distância, e o atacante não usa a sua interface.

**Cenário:** nomeie o dado e a rota que continua servindo. "O `PainelAdmin` só
renderiza para `papel === 'admin'`, mas `/api/usuarios` devolve a lista
completa com e-mail e telefone para qualquer sessão autenticada."

`critica` para dado sensível; `alta` para funcionalidade sem dado.

O padrão correto: a checagem no cliente é **conveniência de UX**, e existe
sempre uma checagem correspondente no servidor. Confira o par — se só um lado
existe, é finding.

## Onde o token mora

| Local | Risco |
|---|---|
| Cookie `httpOnly` + `Secure` + `SameSite` | Padrão recomendado. Script não lê |
| Cookie sem `httpOnly` | Qualquer script na página lê. `alta` |
| `localStorage` | Idem, e persiste indefinidamente. `alta` |
| `sessionStorage` | Melhor que `localStorage` (morre com a aba), ainda legível por script. `media` |
| Memória (variável/estado) | Bom; exige refresh via cookie |
| `AsyncStorage` (RN) | Texto puro no dispositivo. `alta` — ver [react-native.md](react-native.md) |
| `SecureStore`/Keychain (RN) | Padrão recomendado em mobile |

O argumento "XSS quebra tudo mesmo" não vale: `httpOnly` é exatamente a
camada que impede o XSS de virar roubo de sessão persistente.

### Flags de cookie

```bash
grep -rn "cookies()\.set\|setCookie\|Set-Cookie\|res.cookie" src app lib
```

- `httpOnly: false` (ou ausente) em cookie de sessão: `alta`.
- `secure: false` em produção: `alta` — trafega em claro em HTTP.
- `sameSite` ausente: navegadores modernos usam `Lax` por padrão, então isso
  virou `media`; continua valendo declarar explicitamente.
- `sameSite: "none"` sem `secure`: o navegador rejeita — bug, além de risco.
- Cookie sem `maxAge`/`expires` numa sessão que deveria expirar: `media`.

## Ciclo de vida da sessão

- **Token sem expiração, ou com expiração longa demais** (dias) sem refresh:
  uma sessão roubada vale para sempre. `alta`.
- **Refresh token com a mesma proteção do access token** — se os dois estão no
  mesmo lugar acessível, ter dois não adiciona nada.
- **Logout que não invalida no servidor**: apagar o cookie no cliente não
  invalida o JWT, que continua aceito até expirar. `media`; `alta` se a
  expiração for longa.
- **Sessão não renovada após troca de senha ou mudança de permissão** — o
  usuário revogado continua dentro. `alta`.
- **Ausência de proteção contra força bruta no login**: se o login está no
  Next, o finding é seu; se está num backend externo, é observação com a
  ressalva de que o backend não foi auditado.

## JWT

Quando o projeto lida com JWT direto:

- **Assinatura verificada no servidor?** `jwt.decode()` **não verifica** —
  apenas decodifica. Usar `decode` onde deveria ser `verify` é `critica`.
- **Algoritmo fixado explicitamente?** Aceitar o `alg` do próprio token abre a
  troca por `none` ou por HMAC com a chave pública. `critica`.
- **Claims checados**: `exp`, `iss`, `aud`. Só `exp` é o mínimo.
- **Dado sensível dentro do payload** — JWT é assinado, não criptografado:
  qualquer um decodifica. CPF ou papel interno no payload é `media`.
- **Segredo de assinatura fraco ou hardcoded**: `critica`, e ver
  [segredos.md](segredos.md).

## CSRF

Relevante quando a autenticação é por cookie:

- Mutação por `POST` com cookie de sessão e **sem** token anti-CSRF **e** com
  `SameSite` ausente ou `none`: `alta`.
- Com `SameSite: Lax` ou `Strict`, o risco cai bastante — `Lax` ainda permite
  navegação de topo com `GET`, então **mutação por `GET` continua sendo
  finding**.
- Server actions do Next têm proteção de origem embutida; route handlers
  chamados por formulário, não necessariamente.

## OAuth e provedores

- **`state` ausente ou não verificado** no fluxo de autorização: permite CSRF
  no login. `alta`.
- **PKCE ausente** em cliente público (SPA, mobile): `alta`.
- **`redirect_uri` com curinga** ou aceitando parâmetro do cliente: permite
  desviar o código de autorização. `critica`.
- **Client secret embutido em app mobile ou SPA**: um cliente público não pode
  guardar segredo. `alta` — a correção é PKCE, não esconder melhor.
- **Token do provedor guardado no cliente** quando poderia ficar em cookie de
  servidor.

## Enumeração e vazamento por mensagem

- **Login que diferencia "usuário não existe" de "senha incorreta"**: permite
  enumerar contas. `media`.
- **Recuperação de senha que confirma se o e-mail existe**: mesma coisa.
  `media`.
- **Tempo de resposta muito diferente** entre usuário existente e inexistente:
  observação — difícil de confirmar estaticamente.

## Multi-tenant

Quando o app separa dados por organização, cliente ou espaço:

- **Identificador de tenant vindo do cliente e usado sem verificação**:
  `?orgId=` na query, header customizado, campo no corpo. O tenant tem que vir
  da sessão. `critica`.
- **Query sem filtro de tenant** em alguma rota — basta uma para o isolamento
  cair inteiro. Vale varrer todas as queries procurando as que não filtram.

## Checklist

Percorra uma vez, com o código na mão:

- [ ] Toda tela protegida tem uma checagem **no servidor** correspondente?
- [ ] O token está em local inacessível a script?
- [ ] O cookie de sessão tem `httpOnly`, `Secure` e `SameSite`?
- [ ] A sessão expira, e o logout invalida do lado do servidor?
- [ ] JWT é **verificado** (não só decodificado), com algoritmo fixado?
- [ ] Mutações exigem `POST` e estão protegidas contra CSRF?
- [ ] Autorização por recurso (este usuário, este registro) e não só por papel?
- [ ] O identificador de tenant vem da sessão, nunca do cliente?

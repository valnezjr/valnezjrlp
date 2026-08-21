# Segurança — camada server do Next

A parte do Next que roda no servidor tem um problema de percepção: **parece
código interno e é superfície pública**. Server actions viram endpoints HTTP.
Route handlers são rotas abertas. Middleware que "protege" muitas vezes só
redireciona.

Este arquivo cobre App Router e Pages Router.

## Server actions

```bash
grep -rn '"use server"' src app lib
```

Cada função marcada com `"use server"` é um **endpoint POST público**. O
atacante não precisa passar pelo seu formulário: ele chama a action direto,
com o corpo que quiser.

As três perguntas, na ordem:

### 1. Quem está chamando?

```tsx
"use server";
export async function excluirPedido(id: string) {
  await db.pedido.delete({ where: { id } });     // ← qualquer um, qualquer id
}
```

A action precisa obter a sessão **dentro dela**, no servidor. Confiar em o
componente que a chama já ter checado não vale: a action é chamável sem passar
por componente nenhum.

`critica` quando a action lê ou modifica dado de outro usuário.

### 2. Essa pessoa pode fazer isso com esse recurso?

Autenticação não é autorização. Um usuário logado qualquer chamando
`excluirPedido` com o id do pedido de outro é o defeito mais comum de todos —
o servidor sabe quem é, mas não checa se o recurso é dele.

```tsx
const sessao = await getSession();
if (!sessao) throw new Error("não autenticado");
const pedido = await db.pedido.findUnique({ where: { id } });
if (pedido?.usuarioId !== sessao.userId) throw new Error("não autorizado");
```

`critica`.

### 3. A entrada foi validada?

Tipagem TypeScript **não valida nada em runtime** — a assinatura
`(id: string)` some na compilação. Uma action tipada continua recebendo o que
o cliente mandar.

Correção: validar com zod/valibot no início da action. `alta` quando a entrada
alimenta query, caminho de arquivo ou chamada externa.

## Route handlers

```bash
find app -name 'route.ts' -o -name 'route.tsx' 2>/dev/null
ls pages/api 2>/dev/null
```

Mesmas três perguntas. Somando o que é próprio de rota:

- **Parâmetro de rota usado sem checar propriedade**: `/api/pedidos/[id]` que
  devolve o pedido sem confirmar que é do usuário da sessão. `critica`. É a
  falha mais comum de API em qualquer stack, e a mais fácil de não ver, porque
  o código parece correto.
- **Método não restrito**: handler que trata `GET` e `POST` igual, permitindo
  mutação por GET — e portanto por link, imagem ou prefetch.
- **CORS permissivo**: `Access-Control-Allow-Origin: *` numa rota que responde
  dado autenticado. `alta`. Com `Allow-Credentials: true` junto, `critica`.
- **Erro devolvendo o erro cru**: `catch (e) { return Response.json({ e }) }`
  vaza estrutura de banco, caminho de arquivo e às vezes credencial de conexão.
  `media`.
- **Rota de debug/admin sem proteção** — `/api/debug`, `/api/seed`,
  `/api/health` que devolve config. `alta`.

## Middleware

```bash
cat middleware.ts middleware.js 2>/dev/null
```

Middleware é ótimo para experiência de navegação e **insuficiente como única
camada de autorização**. Dois motivos:

1. O `matcher` quase sempre tem furos — uma rota nova fora do padrão não é
   coberta, e ninguém percebe.
2. Ele protege a navegação, não necessariamente o acesso ao dado: a API por
   baixo continua respondendo.

O finding é: **a autorização existe no middleware e não existe na rota/action
que serve o dado**. `critica` para dado sensível.

Verifique também o `matcher` contra a lista de rotas do recon — rota
autenticada fora do padrão do matcher é finding por si só.

## Fronteira servidor → cliente

O vazamento silencioso do App Router: um server component busca o registro
inteiro e passa como prop para um client component. Tudo que vira prop é
serializado no HTML e **legível no "ver código-fonte"**.

```tsx
const usuario = await db.usuario.findUnique({ where: { id } });
return <Perfil usuario={usuario} />;   // hash de senha, papel, e-mail interno…
```

Correção: selecionar campos explicitamente (`select`), ou montar um DTO antes
de passar.

`alta`; `critica` se inclui hash de senha, token ou dado de terceiros.

Relacionado, e mais grave: **`process.env` privado usado em arquivo com
`"use client"`**. Ver [segredos.md](segredos.md).

```bash
grep -rln '"use client"' src app | xargs grep -ln "process\.env\." 2>/dev/null
```

## Injeção no servidor

O front-end raramente fala com banco direto, mas quando o Next é o backend:

- **SQL concatenado**: `db.$queryRawUnsafe(\`… ${entrada}\`)`, template string
  em `sql`. `critica`. Correção: query parametrizada.
- **Filtro de ORM montado a partir do corpo da requisição**:
  `where: JSON.parse(req.body.filtro)` permite consultar qualquer coisa.
- **Caminho de arquivo vindo da requisição**: `readFile(\`./uploads/${nome}\`)`
  com `nome = "../../.env"`. `critica`.
- **Comando de shell com entrada**: `exec(\`convert ${arquivo}\`)`. `critica`.
- **SSRF**: `fetch(url)` no servidor com `url` vinda do cliente. O servidor
  pode alcançar rede interna e endpoints de metadados de nuvem. `alta`.

## Cache e revalidação

Específico do App Router, e sutil:

- **Resposta autenticada em rota cacheada estaticamente** — a página de um
  usuário servida a outro. Rota que lê sessão precisa ser dinâmica
  (`cookies()`/`headers()` já forçam isso; `force-static` explícito quebra).
  `critica` quando acontece.
- **`revalidateTag`/`revalidatePath` chamável sem autorização** a partir de uma
  action pública: permite invalidar cache à vontade. `media`.
- **`fetch` de dado por usuário sem `cache: "no-store"`** dentro de função
  compartilhada: o dado do primeiro usuário é reaproveitado. `alta`.

## Uploads

- Tipo e tamanho validados **no servidor**, não só no cliente.
- Nome de arquivo saneado — nome vindo do cliente com `../` escreve fora do
  destino.
- Arquivo servido de volta com `Content-Type` correto e
  `Content-Disposition: attachment` quando for conteúdo de usuário — um SVG ou
  HTML servido inline executa script na sua origem. `alta`.

## Checklist rápido por endpoint

Para cada server action e cada route handler encontrado:

- [ ] Obtém a sessão **dentro** da própria função?
- [ ] Checa se **este** usuário pode acessar **este** recurso?
- [ ] Valida a entrada em runtime, não só por tipo?
- [ ] Restringe o método HTTP?
- [ ] Devolve erro genérico, sem detalhe interno?
- [ ] Não devolve mais campos do que a tela precisa?

Cada "não" é candidato a finding. O cenário precisa dizer **qual requisição um
atacante montaria** — sem escrever a requisição.

# Segredos

O achado de maior impacto do eixo, e o de confirmação mais rápida. Também o
único capaz de transformar o relatório num vazamento — leia a seção de cuidado
no SKILL.md antes de escrever qualquer finding daqui.

## Regra de ouro do relatório

**O valor nunca entra no relatório.** Nem truncado pela metade, nem "só o
começo pra identificar". Prefixo identificador (`sk_live_`, `AKIA`, `ghp_`) e
o resto mascarado:

```
evidencia: "const STRIPE_KEY = \"sk_live_****************************\";"
```

E na conversa, ao encontrar algo válido em arquivo versionado: **avise na
hora**, antes de terminar a auditoria. Rotação de chave é urgente; o relatório
pode esperar.

## O que varrer

Escopo padrão: **estado atual do repositório**, incluindo arquivos que não
estão em `src/` — config, scripts, CI, docs. Segredo raramente está onde se
procura.

```bash
# arquivos de ambiente versionados (o caso mais comum e mais grave)
git ls-files | grep -E '^\.env|/\.env' 

# .env presente e não ignorado
ls -a | grep '^\.env'; grep -n '\.env' .gitignore
```

Um `.env` com valores reais rastreado pelo git é `critica` imediata,
independente de qualquer outra coisa. `.env.example` com placeholders é
correto e não é finding.

## Padrões

```bash
ALVO="src app pages lib components scripts .github next.config.* vite.config.* app.json app.config.*"

# chaves por prefixo conhecido
grep -rnE "\b(sk_live_|sk_test_|pk_live_|rk_live_|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|gho_|github_pat_|xox[baprs]-|AIza[0-9A-Za-z_-]{35}|SG\.[A-Za-z0-9_-]{22}|glpat-)" $ALVO 2>/dev/null

# atribuições suspeitas
grep -rniE "(api[_-]?key|secret|password|passwd|token|private[_-]?key|client[_-]?secret|auth)\s*[:=]\s*['\"][^'\"]{12,}" $ALVO 2>/dev/null

# chaves privadas e certificados
grep -rn "BEGIN RSA PRIVATE KEY\|BEGIN PRIVATE KEY\|BEGIN OPENSSH PRIVATE KEY\|BEGIN CERTIFICATE" . --exclude-dir=node_modules 2>/dev/null

# strings de conexão
grep -rnE "(mongodb(\+srv)?|postgres(ql)?|mysql|redis|amqp)://[^:]+:[^@]+@" $ALVO 2>/dev/null

# JWT literal no código
grep -rnE "eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\." $ALVO 2>/dev/null
```

Ferramenta dedicada, se disponível (mais precisa, com verificação de formato):

```bash
npx --yes @secretlint/quick-start "**/*"
# ou, se o usuário tiver instalado: gitleaks detect --no-git --redact
```

`--redact` no gitleaks é obrigatório — sem ele a saída imprime os valores.

## Variáveis de ambiente expostas ao cliente

Este é o vazamento que mais passa despercebido, porque o código parece correto.

| Framework | Prefixo público | Consequência |
|---|---|---|
| Next.js | `NEXT_PUBLIC_*` | Inlined no bundle do navegador em tempo de build |
| Vite | `VITE_*` | Idem |
| CRA | `REACT_APP_*` | Idem |
| Expo | `EXPO_PUBLIC_*` | Idem, e o bundle é legível dentro do APK/IPA |

```bash
grep -rnE "NEXT_PUBLIC_|VITE_|REACT_APP_|EXPO_PUBLIC_" src app pages 2>/dev/null | sort -u
```

Para cada uma, pergunte: **essa credencial pode ser lida por qualquer
visitante?** Se a resposta é não, é `critica`.

O erro clássico:

```js
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=...   // service role é privada. crítica.
NEXT_PUBLIC_SUPABASE_ANON_KEY=...            // anon é pública por design. correta.
```

### Chaves que são públicas por design — não reporte

Reportar uma dessas como vazamento derruba a credibilidade do relatório
inteiro. Confirme o tipo antes:

- Firebase web config (`apiKey` do SDK web) — pública; a proteção são as
  Security Rules. O finding possível é "regras permissivas", não "chave
  exposta".
- Stripe **publishable key** (`pk_live_`/`pk_test_`) — pública. `sk_live_` não.
- Supabase **anon key** — pública. `service_role` não.
- Google Maps / reCAPTCHA site key — públicas; a proteção é restrição de
  domínio. Se não houver restrição configurada, esse é o finding.
- PostHog / Sentry **public DSN** — pública por construção.

## Onde mais procurar

Fora do código-fonte, na ordem em que vale olhar:

- **Config de build**: `next.config.js`, `vite.config.ts`, `app.config.js`,
  `metro.config.js` — chave passada via `define`/`env` acaba no bundle.
- **Workflows de CI**: `.github/workflows/*.yml`. Segredo escrito direto em vez
  de `${{ secrets.X }}`. `critica`.
- **`app.json` / `app.config.js` do Expo** — vai inteiro para o app publicado.
- **`package.json`** — token dentro de URL de dependência privada
  (`https://user:token@…`), ou em script.
- **Docs e READMEs** — exemplo de curl com token real é frequente.
- **Fixtures, mocks e snapshots de teste** — token real usado "só pra testar".
- **Comentários** — credencial antiga deixada comentada.
- **`.npmrc`, `.netrc`, `.yarnrc.yml`** versionados.

## Modo opcional: histórico do git

Não roda por padrão. Acione só a pedido, e explique o custo antes.

```bash
gitleaks detect --redact --report-format json --report-path /tmp/hist.json
# ou, sem gitleaks, uma varredura rasa e barata:
git log -p --all -S 'sk_live_' --oneline | head
```

Duas ressalvas que precisam ir junto:

1. Em repo grande, isso demora — minutos a dezenas de minutos.
2. Um segredo encontrado no histórico **continua válido**. Remover o commit
   não resolve: reescrever o histórico é doloroso e nunca é garantia (forks,
   clones, caches de CI). A correção real é **rotacionar a credencial**. Diga
   isso explicitamente, sempre.

## Como escrever o finding

```jsonc
{
  "eixo": "seguranca",
  "severidade": "critica",
  "titulo": "Chave secreta do Stripe exposta em variável pública",
  "arquivo": ".env.production",
  "linha": 7,
  "evidencia": "NEXT_PUBLIC_STRIPE_SECRET=sk_live_****************************",
  "cenario": "A variável usa o prefixo NEXT_PUBLIC_, que o Next inlina no bundle do navegador em tempo de build. A chave secreta do Stripe está legível no JavaScript servido a qualquer visitante do site, e permite criar cobranças e ler dados de clientes pela API.",
  "impacto": "Credencial de pagamento com poder de escrita acessível publicamente.",
  "correcao": "Rotacionar a chave no painel do Stripe imediatamente — ela deve ser considerada comprometida. Depois, mover para uma variável sem o prefixo público e usá-la apenas em código de servidor.",
  "esforco": "baixo",
  "confianca": "alta",
  "risco": "baixo",
  "origem": "leitura",
  "regra": "comunidade:segredo-em-var-publica"
}
```

Três coisas que este exemplo faz e que todo finding de segredo precisa fazer:
mascara o valor, explica o **mecanismo** da exposição (não só "está exposto"), e
manda **rotacionar** antes de mandar mover.

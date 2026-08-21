# Segurança — React Native (Expo e CLI)

A diferença que organiza tudo: **o bundle JS está dentro do app instalado, e o
app instalado está na mão do usuário.** Extrair o JS de um APK é trivial —
`unzip`, e o bundle está lá. Assumir que algo no código é secreto porque "está
compilado" é o erro base deste eixo em mobile.

Além disso, o app tem armazenamento próprio, esquemas de URL próprios e acesso
a APIs do sistema. Superfície maior que a web em alguns pontos, menor em
outros.

## Segredos no bundle

```bash
grep -rnE "(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{12,}" src app 2>/dev/null
grep -rn "EXPO_PUBLIC_" src app app.json app.config.* 2>/dev/null
cat app.json app.config.js 2>/dev/null | head -60
```

Três lugares específicos de RN:

1. **`app.json` / `app.config.js`** — vai inteiro para o app publicado, e o
   campo `extra` é lido em runtime. Chave privada ali é `critica`.
2. **`EXPO_PUBLIC_*`** — inlined no bundle, igual à web, e legível no APK.
3. **Constantes no código** — `const API_SECRET = "..."`. Não existe
   ofuscação que resolva; o app precisa da chave em claro para usá-la.

A correção quase nunca é "esconder melhor". É **mover a operação para o
servidor**: o app chama uma rota sua, e o servidor guarda a chave de terceiro.
Diga isso no `correcao` em vez de sugerir ofuscação, que não funciona.

## Armazenamento

```bash
grep -rn "AsyncStorage\|MMKV\|SecureStore\|Keychain\|EncryptedStorage" src app
```

| Mecanismo | Proteção real |
|---|---|
| `AsyncStorage` | **Nenhuma.** Texto puro no sandbox do app. Legível em dispositivo com root/jailbreak e em backup não criptografado |
| MMKV sem chave de criptografia | Nenhuma |
| `expo-secure-store` | Keychain (iOS) / Keystore (Android) |
| `react-native-keychain` | Idem |
| `react-native-encrypted-storage` | Idem |

**Token de sessão, refresh token, senha, PIN ou chave em `AsyncStorage` é
`alta`.** Preferência de tema e cache de lista, não.

Confira também:

- O logout limpa o storage seguro **e** o comum? Token removido e perfil
  mantido é `media`.
- Cache de resposta de API com dado pessoal persistido em disco sem expiração.

## Deep links

```bash
grep -rn "Linking.addEventListener\|Linking.getInitialURL\|useURL\|scheme" src app app.json 2>/dev/null
```

Um deep link é entrada **não confiável**: qualquer app, site ou QR code pode
disparar `meuapp://…` com o conteúdo que quiser.

O que verificar em cada handler:

- **Ação executada direto do link, sem confirmação e sem checar sessão** —
  `meuapp://transferir?valor=500&para=X`. `critica`.
- **Parâmetro do link usado como URL de navegação ou de WebView** — leva o
  usuário a conteúdo do atacante dentro do seu app. `alta`.
- **Token ou código de autenticação recebido por deep link sem validação de
  origem.** Em Android, esquema customizado pode ser reivindicado por outro
  app instalado; o padrão seguro é App Links / Universal Links **verificados**
  por domínio (`assetlinks.json`, `apple-app-site-association`).
- **`intent://` no Android** com extras controláveis.

Verifique se o `scheme` do `app.json` é verificado por domínio ou é só um
esquema customizado — a diferença decide a severidade.

## WebView

```bash
grep -rn "WebView" src app
```

WebView é a maior superfície de ataque típica de um app RN:

- **`source={{ uri }}` com URI vinda de deep link, push ou API.** `alta`.
- **`javaScriptEnabled` (padrão `true`) carregando conteúdo de terceiro.**
- **`injectedJavaScript` que interpola dado dinâmico** — injeção direta no
  contexto da página. `critica`.
- **`onMessage` sem validar a origem da mensagem** — a ponte
  WebView→nativo aceita qualquer coisa que a página mandar.
- **`allowFileAccess` / `allowUniversalAccessFromFileURLs` ligados** —
  permitem ler arquivos locais do app a partir do conteúdo carregado.
  `critica`.
- **`originWhitelist={["*"]}`** — deixa a WebView navegar para qualquer lugar,
  inclusive fora do domínio pretendido, mantendo a ponte ativa. `alta`.

Correção padrão: `originWhitelist` restrita, `onShouldStartLoadWithRequest`
bloqueando navegação fora da lista, e nenhuma ponte exposta a conteúdo que não
seja seu.

## Rede

- **HTTP em claro.** Android bloqueia por padrão desde a API 28; um
  `usesCleartextTraffic: true` no manifest ou `NSAllowsArbitraryLoads` no
  `Info.plist` reabre isso para o app inteiro. `alta`. Exceção comum e
  legítima: configuração só de desenvolvimento — confirme que não vale para o
  build de produção.
- **Validação de certificado desligada** para "resolver" erro de TLS. Anula o
  TLS. `critica`.
- **Certificate pinning ausente**: **não é finding por padrão.** Só vale
  reportar em app que lida com pagamento ou dado altamente sensível, e mesmo
  aí como `baixa`/observação — pinning mal feito derruba o app quando o
  certificado é renovado.

## Sistema e permissões

- **Permissões declaradas e não usadas** (`app.json`, `AndroidManifest.xml`,
  `Info.plist`). Câmera, localização, contatos, microfone pedidos sem uso
  correspondente no código. `media` — aumenta a superfície e reprova em
  revisão de loja.
- **Clipboard**: escrever token ou senha no clipboard; ou ler o clipboard sem
  ação do usuário (iOS avisa o usuário, e isso vira reclamação).
- **`console.log` em produção** com dado sensível — em RN os logs saem no
  logcat do Android, legíveis por ferramentas do sistema. `media`; `alta` se
  inclui token.
- **Screenshot/task switcher**: tela com dado sensível sem `FLAG_SECURE`
  (Android) nem véu no `applicationWillResignActive` (iOS). `media` em app
  financeiro ou de saúde; observação nos demais.
- **Detecção de root/jailbreak ausente**: não é finding. É controle de
  produto, contornável, e sua ausência não é uma brecha.

## Autenticação biométrica

Quando o app usa `expo-local-authentication` ou `react-native-biometrics`:

- Biometria usada como **única** barreira para dado que o servidor deveria
  proteger. A biometria valida a pessoa no dispositivo; não autentica a
  requisição. `alta` se o token fica desprotegido depois.
- Resultado da biometria checado só no JS, sem vincular à liberação de uma
  chave no Keychain/Keystore: contornável em dispositivo comprometido.
  `media`.

## Atualizações OTA

Expo Updates / CodePush entregam JS novo sem passar pela loja:

- **Canal de update sem assinatura de código** (`expo-updates` com code signing
  desligado): quem controlar o canal controla o app. `alta`.
- **URL de update configurável em runtime** ou vinda de fonte não confiável.
  `critica`.

## Não são findings

- Ausência de ofuscação de código. Não protege segredo e dificulta depuração.
- Ausência de detecção de emulador ou de root.
- Ausência de pinning em app comum.
- `AsyncStorage` guardando preferência, cache de UI ou rascunho.
- Permissão declarada e de fato usada, mesmo que ampla.
- Sugerir uma biblioteca de segurança mobile sem vetor concreto identificado.

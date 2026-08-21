# Severidade

Quatro níveis, com critérios objetivos. A regra é: se dois auditores
diferentes classificariam o mesmo achado em níveis diferentes, o critério
está mal escrito — não o auditor.

Severidade mede **consequência**, nunca esforço de correção. Um typo de uma
letra que derruba a produção é crítico; uma refatoração de dois dias que
melhora legibilidade é baixa.

## `critica`

Já está quebrado, ou quebra na próxima condição normal de uso.

- Erro em runtime num caminho alcançável (crash, tela branca, loop infinito).
- Vazamento: listener/timer/subscription sem cleanup em componente que monta
  e desmonta com frequência.
- Erro de hidratação em Next/SSR — o cliente diverge do servidor.
- Funcionalidade inalcançável por teclado ou leitor de tela num fluxo
  essencial (login, checkout, formulário principal).
- Dependência com breaking change já publicado que o projeto vai encontrar
  no próximo `install`.
- Segredo válido exposto ao cliente ou versionado; XSS com dado de usuário;
  rota que serve dado sensível sem autorização no servidor.

Nunca combina com `confianca: "baixa"`. Se não deu pra confirmar, é `alta`.

## `alta`

Degrada a experiência de forma perceptível, ou multiplica trabalho futuro
de forma mensurável.

- Re-render em cascata mensurável: contexto/estado que dispara re-render em
  10+ componentes por interação comum.
- Lista sem virtualização com mais de ~100 itens em uso real (não a
  capacidade teórica — o número que os dados do projeto de fato produzem).
- Import que arrasta ≥ 100 KB gzip para o bundle inicial sem uso proporcional.
- `any` numa fronteira de dados (props públicas, retorno de fetch, payload
  de API) — apaga a checagem de tipo do ponto onde ela mais protege.
- Ciclo de dependência entre módulos.
- Contraste abaixo de 4.5:1 em texto de corpo, ou foco invisível num
  controle interativo.
- Estado marcado só por cor, sem `aria-*` correspondente.
- Código morto que ainda é importado (a `knip` acha, o bundler não remove).
- Falha explorável com uma pré-condição plausível: autorização decidida só no
  cliente, token em armazenamento acessível a script, redirect aberto,
  dependência com CVE em caminho alcançável.

## `media`

Custa manutenção, ou degrada em condições específicas.

- Duplicação de lógica em 3+ lugares que divergem entre si.
- Componente com duas responsabilidades que mudam por motivos diferentes.
- Efeito com array de dependências incompleto, mas cujo caminho de falha
  exige uma sequência incomum.
- Dependência sem release há mais de 2 anos e sem alternativa direta.
- Barrel file (`index.ts` que reexporta tudo) que impede tree-shaking num
  ponto quente.
- `useMemo`/`useCallback` aplicado onde o custo da comparação supera o
  cálculo — memoização é custo, não benefício automático.
- Alvo de toque abaixo de 44×44 (React Native) ou 24×24 CSS px (web).
- Defesa enfraquecida sem exploração direta: cookie sem `SameSite`, CSP
  permissiva, dado sensível em log, validação ausente onde o servidor ainda
  checa depois.

## `baixa`

Vale arrumar quando o arquivo já estiver aberto por outro motivo.

- Nomenclatura fora do padrão do projeto.
- Export não usado que o bundler já elimina.
- Comentário obsoleto que descreve comportamento que não existe mais.
- Aninhamento profundo sem consequência funcional.
- Inconsistência de formatação que o linter do projeto não pega.

## Modificadores

Dois ajustes, aplicados depois da classificação base:

**Sobe um nível** quando o arquivo está no topo da priorização (alta
volatilidade **e** alto grau de entrada). O mesmo defeito no arquivo que 40
módulos importam e que muda toda semana custa mais que num canto parado.

**Desce um nível** quando o código está comprovadamente morto — atrás de uma
flag desligada, num diretório não referenciado, num export que `knip` marcou
como não usado. Continua sendo finding (código morto é o próprio achado),
mas a consequência do defeito lá dentro é hipotética.

Nenhum modificador leva a `critica`. Crítico é sempre classificação base.

## Segurança: a confiança pesa mais

No eixo `seguranca`, um falso positivo custa mais caro que nos outros — some
tempo caro e corrói a confiança no relatório inteiro. Regra adicional: se você
**não confirmou** que o dado não confiável chega até o ponto perigoso, a
severidade não passa de `media` e a confiança fica em `media`. Suspeita bem
fundamentada é observação, não achado crítico.

---
name: audit-clean-code
description: Audita limpeza de código e arquitetura em projetos React e React Native — código morto, duplicação divergente, componentes com responsabilidades misturadas, hooks customizados mal extraídos, ciclos de dependência, acoplamento entre camadas, tipagem frouxa em fronteiras, nomenclatura fora do padrão do projeto. Use quando o pedido for "esse código está bagunçado", "auditar a arquitetura", "tem muita duplicação aqui", "o que dá pra limpar nesse repo", ou quando a skill audit-frontend delegar este eixo. Não usar para performance de render, peso de bundle ou acessibilidade — cada um tem sua skill.
---

# Audit Clean Code

Limpeza e arquitetura: o que custa manutenção. Não o que custa milissegundos
(isso é `audit-render-perf`) nem quilobytes (`audit-bundle-deps`).

## Entrada e saída

Recebe `stack`, `convencoes`, `arquivosPrioritarios`, `raiz`. Devolve **apenas**
um array JSON no formato de `audit-frontend/references/finding-format.md`.
Sem prosa, sem arquivo escrito.

## A regra que evita o desastre deste eixo

Clean code é o eixo onde uma auditoria automática mais facilmente vira uma
lista de gosto pessoal. A defesa é uma pergunta obrigatória antes de cada
finding:

> **Que trabalho concreto isso já custou, ou vai custar na próxima mudança?**

Se a resposta é "o código ficaria mais bonito", não é finding. Se é "uma
correção precisou ser aplicada em três lugares e um ficou de fora", é.

Duas consequências:

- **Tamanho não é achado.** Um componente de 600 linhas coeso é melhor que
  seis de 100 com estado vazando entre eles. Tamanho é sinal para olhar, não
  motivo para reportar. O achado é a consequência que o tamanho esconde.
- **Padrão que o projeto declara vence a literatura.** Se `.audit/convencoes.md`
  diz "arquivos por área, não um por componente", um arquivo com 8 componentes
  está correto — e sugerir quebrar é erro de auditoria, não observação útil.

## Ordem de trabalho

### 1. Ferramentas

```bash
npx knip --reporter json                                  # morto: arquivos, exports, deps
npx madge --circular --extensions ts,tsx,js,jsx src        # ciclos
npx jscpd src --min-lines 12 --min-tokens 70 --reporters json --silent
npx tsc --noEmit                                           # erros pré-existentes
npx eslint . --format json                                 # o que o time já vê
```

Ajustes que evitam falso positivo:

- `knip` marca rotas de Next e `expo-router` como "arquivos não usados" —
  são entrypoints implícitos. Confirme contra a lista de entrypoints do recon
  antes de reportar qualquer arquivo como morto.
- `jscpd` acusa duplicação em código gerado, migrations e fixtures. Exclua-os.
- Duplicação em arquivos de teste não é finding deste eixo.

### 2. Contar antes de ler

Métricas baratas que dirigem a leitura, nenhuma delas finding por si só:

```bash
# maiores arquivos de componente
find src -name '*.tsx' -not -path '*/node_modules/*' | xargs wc -l | sort -rn | head -25

# concentração de any
grep -rn ": any\b\|as any\b\|<any>" src --include='*.ts' --include='*.tsx' | wc -l

# @ts-ignore / @ts-expect-error sem justificativa
grep -rn "@ts-ignore\|@ts-expect-error" src

# TODO/FIXME antigos
git log -S 'TODO' --format='%ad %h' --date=short -- src | tail -5
```

### 3. Leitura dirigida

Catálogo de padrões em nível de código: [references/catalogo.md](references/catalogo.md).
Camadas, fronteiras e estrutura: [references/arquitetura.md](references/arquitetura.md).

## Achados que quase sempre valem

1. **Duplicação que divergiu.** Três cópias da mesma função de formatação onde
   uma já foi corrigida e as outras não. O cenário é a divergência, não a
   cópia. `alta` — é um bug esperando o turno dele.
2. **Ciclo de dependência.** `madge --circular`. Quebra tree-shaking, gera
   `undefined` em import na ordem errada, e trava refatoração. `alta`.
3. **Código morto ainda importado.** `knip` acha o export não usado; se algo
   ainda o importa, o bundler não elimina. Peso + confusão.
4. **`any` em fronteira.** Props públicas, retorno de fetch, payload de API,
   parâmetro de callback exportado. Apaga a checagem exatamente onde ela mais
   vale. `alta`. `any` interno num utilitário privado é `baixa` ou observação.
5. **`@ts-ignore` sem comentário.** Silencia um erro que ninguém sabe mais
   qual era. `media`; `alta` se o erro silenciado é de nulidade.
6. **Estado que atravessa responsabilidades.** Um componente onde o estado do
   formulário, o estado do modal e o cache da lista convivem e se leem
   mutuamente. Esse é o caso em que quebrar o componente é a correção certa —
   e o cenário é o vazamento, não o tamanho.
7. **Hook customizado que devolve 8 coisas.** Sinal de que ele virou um
   componente sem JSX. Quase sempre são dois ou três hooks.
8. **Lógica de negócio dentro do componente.** Cálculo de regra, transformação
   de payload, decisão de permissão misturados com JSX. Só é finding quando a
   mesma lógica precisa existir em outro lugar (ou já existe, duplicada).
9. **Tratamento de erro engolido.** `catch {}` vazio, ou `catch (e) { console.log(e) }`
   num caminho que o usuário percorre. O erro some e a UI fica em estado
   indefinido. `alta`.
10. **Nomenclatura fora do padrão do próprio projeto.** Só quando há padrão
    declarado ou dominante — e nesse caso o cenário é a inconsistência, com a
    contagem de quantos arquivos seguem o padrão e quantos não.

## Anti-catálogo deste eixo

- Arquivo grande sem consequência observável.
- Função com "muitos parâmetros" quando eles são coesos e tipados.
- Aninhamento profundo que o `early return` melhoraria mas que não esconde bug.
- Ausência de comentários. (Excesso de comentário que descreve o *o quê* em vez
  do *porquê* também não é finding — é observação.)
- Preferência entre `function` e arrow, `interface` e `type`, default export e
  nomeado, quando o projeto não declara preferência.
- Estrutura de pastas diferente da que a literatura recomenda, num projeto que
  é internamente consistente. Consistência vence convenção externa.
- Sugerir uma biblioteca de estado/formulário/validação sem um problema
  concreto que ela resolva.
- Ausência de testes como item repetido. Entra uma vez, nos limites do
  relatório da orquestradora — não como finding por arquivo.

## Interseções

- Arquivo morto que ainda pesa no bundle: o peso é `bundle-deps`, a morte é
  sua. Reporte o seu; a consolidação junta.
- Componente com estado misturado que também re-renderiza demais: o
  re-render é `render-perf`. Reporte a mistura.
- `any` num handler de evento que também apaga a tipagem de acessibilidade:
  é seu.

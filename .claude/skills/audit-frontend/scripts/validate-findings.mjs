#!/usr/bin/env node
/**
 * Valida .audit/findings.json antes de virar relatório.
 * Uso: node validate-findings.mjs [caminho/findings.json] [--raiz .]
 *
 * Sai com código 1 se houver erro. Um findings.json que não valida
 * não vira relatório — a validação é o que impede achado inventado,
 * caminho errado e severidade dada no gosto.
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const arquivo = args.find((a) => !a.startsWith("--")) ?? ".audit/findings.json";
const raiz = (args.find((a) => a.startsWith("--raiz=")) ?? "--raiz=.").slice(7);

const SEVERIDADES = ["critica", "alta", "media", "baixa"];
const EIXOS = ["render-perf", "clean-code", "bundle-deps", "a11y", "seguranca", "arquitetura"];
const ESFORCOS = ["baixo", "medio", "alto"];
const CONFIANCAS = ["alta", "media", "baixa"];

/* Frases que denunciam cenário genérico — o padrão de falha mais comum
   de auditoria automática. Não é lista exaustiva, é rede de segurança. */
const GENERICAS = [
  /\bpode causar\b/i,
  /\bpode levar a\b/i,
  /\bboas? práticas?\b/i,
  /\bnão é (?:uma )?boa prática\b/i,
  /\bé recomendad[oa]\b/i,
  /\bidealmente\b/i,
  /\bem geral\b/i,
  /\bpode impactar (?:a |o )?performance\b/i,
  /\bpode gerar re-?renders? desnecessári/i,
];

/* Padrões de credencial que nunca devem aparecer em claro no relatório.
   Deliberadamente conservador: pega o formato completo, não o prefixo solto,
   para não acusar um exemplo já mascarado. */
const SEGREDOS = [
  /\bsk_(live|test)_[A-Za-z0-9]{16,}/,
  /\brk_live_[A-Za-z0-9]{16,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bghp_[A-Za-z0-9]{36}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}/,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /\bglpat-[A-Za-z0-9_-]{20,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/,
  /\b(mongodb(\+srv)?|postgres(ql)?|mysql|redis|amqp):\/\/[^\s:@'"]+:[^\s@'"]{6,}@/,
];

const erros = [];
const avisos = [];
const e = (i, m) => erros.push(`[${i}] ${m}`);
const a = (i, m) => avisos.push(`[${i}] ${m}`);

let dados;
try {
  dados = JSON.parse(fs.readFileSync(arquivo, "utf8"));
} catch (err) {
  console.error(`Não foi possível ler ${arquivo}: ${err.message}`);
  process.exit(1);
}

const findings = Array.isArray(dados) ? dados : dados.findings;
if (!Array.isArray(findings)) {
  console.error("findings.json precisa ser um array, ou um objeto com a chave `findings`.");
  process.exit(1);
}

const idsVistos = new Set();
const cacheLinhas = new Map();

function totalDeLinhas(rel) {
  if (cacheLinhas.has(rel)) return cacheLinhas.get(rel);
  let n = null;
  try {
    n = fs.readFileSync(path.join(raiz, rel), "utf8").split("\n").length;
  } catch { /* arquivo inexistente — tratado à parte */ }
  cacheLinhas.set(rel, n);
  return n;
}

findings.forEach((f, idx) => {
  const rot = f.id ?? `#${idx}`;

  for (const campo of ["id", "eixo", "severidade", "titulo", "arquivo", "cenario", "correcao", "esforco", "confianca", "origem", "regra"]) {
    if (!f[campo] || String(f[campo]).trim() === "") e(rot, `campo obrigatório ausente ou vazio: ${campo}`);
  }

  if (f.id) {
    if (idsVistos.has(f.id)) e(rot, `id duplicado`);
    idsVistos.add(f.id);
  }

  if (f.eixo && !EIXOS.includes(f.eixo)) e(rot, `eixo inválido: ${f.eixo}`);
  if (f.severidade && !SEVERIDADES.includes(f.severidade)) e(rot, `severidade inválida: ${f.severidade}`);
  if (f.esforco && !ESFORCOS.includes(f.esforco)) e(rot, `esforço inválido: ${f.esforco}`);
  if (f.confianca && !CONFIANCAS.includes(f.confianca)) e(rot, `confiança inválida: ${f.confianca}`);

  /* Regra dura de severidade.md: crítica exige confirmação. */
  if (f.severidade === "critica" && f.confianca === "baixa") {
    e(rot, `severidade "critica" com confiança "baixa" — confirme o achado ou rebaixe para "alta"`);
  }

  if (f.regra && !/^(convencao|comunidade):[a-z0-9-]+$/.test(f.regra)) {
    e(rot, `regra fora do formato "convencao:<id>" ou "comunidade:<id>": ${f.regra}`);
  }

  if (f.origem && !/^(leitura|consolidacao|ferramenta:[a-z0-9@/.-]+)$/i.test(f.origem)) {
    e(rot, `origem fora do formato esperado: ${f.origem}`);
  }

  /* Arquivo precisa existir de verdade. */
  if (f.arquivo) {
    if (path.isAbsolute(f.arquivo) || f.arquivo.includes("\\")) {
      e(rot, `arquivo deve ser relativo à raiz e usar "/": ${f.arquivo}`);
    }
    const total = totalDeLinhas(f.arquivo);
    if (total === null) {
      if (f.eixo !== "bundle-deps" || !/package\.json$/.test(f.arquivo)) {
        e(rot, `arquivo não encontrado a partir da raiz "${raiz}": ${f.arquivo}`);
      }
    } else if (f.linha != null) {
      if (!Number.isInteger(f.linha) || f.linha < 1) e(rot, `linha inválida: ${f.linha}`);
      else if (f.linha > total) e(rot, `linha ${f.linha} além do fim do arquivo (${total} linhas)`);
      if (f.linhaFim != null && f.linhaFim < f.linha) e(rot, `linhaFim (${f.linhaFim}) anterior a linha (${f.linha})`);
    }
  }

  /* A regra que mais importa: cenário concreto. */
  if (f.cenario) {
    const c = String(f.cenario);
    if (c.length < 60) e(rot, `cenário curto demais (${c.length} caracteres) — provavelmente genérico`);
    const bate = GENERICAS.find((re) => re.test(c));
    if (bate) a(rot, `cenário contém linguagem genérica (${bate.source}) — confirme que nomeia entrada, estado ou condição concreta`);
    if (!/\d/.test(c) && !/`[^`]+`/.test(c)) {
      a(rot, `cenário sem número nem identificador entre crases — cenários concretos quase sempre citam um dos dois`);
    }
  }

  if (f.evidencia && String(f.evidencia).split("\n").length > 12) {
    a(rot, `evidência com mais de 12 linhas — cite só o trecho essencial e use linhaFim`);
  }

  /* Rede de segurança do eixo de segurança: o relatório não pode virar o
     vazamento. Segredo citado em evidência precisa estar mascarado. */
  const textoLivre = [f.evidencia, f.cenario, f.correcao, f.titulo, f.impacto].filter(Boolean).join("\n");
  if (textoLivre) {
    const mascarado = (s) => /\*{4,}|…|\bREDACTED\b|\bomitid[oa]\b/i.test(s);
    for (const re of SEGREDOS) {
      const achado = textoLivre.match(re);
      if (achado && !mascarado(achado[0])) {
        e(rot, `possível segredo NÃO mascarado no texto do finding (padrão ${re.source.slice(0, 28)}…) — mascare o valor antes de publicar o relatório`);
        break;
      }
    }
  }
});

/* Um relatório sem nenhum limite declarado é suspeito por construção. */
if (!Array.isArray(dados.limites) || dados.limites.length === 0) {
  a("relatório", `nenhum limite declarado em "limites" — toda auditoria deixou algo de fora`);
}

console.log(`${findings.length} findings verificados em ${arquivo}\n`);
if (avisos.length) {
  console.log(`Avisos (${avisos.length}):`);
  avisos.forEach((m) => console.log("  ! " + m));
  console.log("");
}
if (erros.length) {
  console.log(`Erros (${erros.length}):`);
  erros.forEach((m) => console.log("  x " + m));
  console.log("\nCorrija os erros antes de gerar o relatório.");
  process.exit(1);
}
console.log("Validação OK." + (avisos.length ? " Revise os avisos acima antes de entregar." : ""));

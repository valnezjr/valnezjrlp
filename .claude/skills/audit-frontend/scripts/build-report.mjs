#!/usr/bin/env node
/**
 * Gera o relatório HTML a partir de .audit/findings.json.
 *
 * Uso:
 *   node build-report.mjs [findings.json] [--projeto="Nome"] [--raiz=.] [--sem-baseline]
 *
 * Saída:
 *   .audit/relatorio-AAAA-MM-DD.html   página única, sem rede, tema claro/escuro
 *   .audit/baseline.json               atualizado (a menos que --sem-baseline)
 *
 * Sem dependências. Node >= 18.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (nome, padrao) => {
  const a = args.find((x) => x.startsWith(`--${nome}=`));
  return a ? a.slice(nome.length + 3).replace(/^["']|["']$/g, "") : padrao;
};

const entrada = args.find((a) => !a.startsWith("--")) ?? ".audit/findings.json";
const raiz = path.resolve(flag("raiz", "."));
const semBaseline = args.includes("--sem-baseline");
const projeto = flag("projeto", path.basename(raiz));

const dirSaida = path.join(raiz, ".audit");
fs.mkdirSync(dirSaida, { recursive: true });

const bruto = JSON.parse(fs.readFileSync(entrada, "utf8"));
const findings = Array.isArray(bruto) ? bruto : bruto.findings ?? [];
const observacoes = Array.isArray(bruto) ? [] : bruto.observacoes ?? [];
const limites = Array.isArray(bruto) ? [] : bruto.limites ?? [];

/* ---- ordenação: severidade desc, depois esforço asc ----
   O topo do relatório precisa ser o que dá mais retorno por hora,
   não o mais grave em abstrato. */
const PESO_SEV = { critica: 0, alta: 1, media: 2, baixa: 3 };
const PESO_ESF = { baixo: 0, medio: 1, alto: 2 };
findings.sort((a, b) =>
  (PESO_SEV[a.severidade] ?? 9) - (PESO_SEV[b.severidade] ?? 9) ||
  (PESO_ESF[a.esforco] ?? 9) - (PESO_ESF[b.esforco] ?? 9) ||
  String(a.arquivo).localeCompare(String(b.arquivo))
);

/* ---- identidade estável de um finding ----
   Não usa a linha: mover código não deve fazer um achado antigo
   parecer resolvido e um novo aparecer no lugar. */
const hashDe = (f) =>
  crypto.createHash("sha1")
    .update([f.eixo, f.regra, f.arquivo, String(f.evidencia ?? "").replace(/\s+/g, " ").trim()].join("|"))
    .digest("hex").slice(0, 12);

/* ---- delta contra o baseline anterior ---- */
const caminhoBaseline = path.join(dirSaida, "baseline.json");
let delta = null;
if (fs.existsSync(caminhoBaseline)) {
  try {
    const anterior = JSON.parse(fs.readFileSync(caminhoBaseline, "utf8"));
    const antes = new Set(anterior.hashes ?? []);
    const agora = new Set(findings.map(hashDe));
    delta = {
      desde: anterior.data ?? "auditoria anterior",
      resolvidos: [...antes].filter((h) => !agora.has(h)).length,
      novos: [...agora].filter((h) => !antes.has(h)).length,
      persistem: [...agora].filter((h) => antes.has(h)).length,
    };
  } catch {
    console.warn("baseline.json ilegível — seguindo sem delta.");
  }
}

/* ---- metadados ---- */
const hoje = new Date().toISOString().slice(0, 10);
let commit = null;
try {
  commit = execSync("git rev-parse --short HEAD", { cwd: raiz, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
} catch { /* repo sem git */ }

const meta = [
  hoje,
  commit ? `commit ${commit}` : null,
  `${findings.length} achados`,
  observacoes.length ? `${observacoes.length} observações` : null,
].filter(Boolean).join(" · ");

/* ---- render ---- */
const template = fs.readFileSync(path.join(aqui, "..", "assets", "relatorio-template.html"), "utf8");
const dados = JSON.stringify(
  { findings, observacoes, limites, delta, raizAbsoluta: raiz.replace(/\\/g, "/") },
  null, 0
).replace(/</g, "\\u003c");  // nunca fechar o <script> por acidente

const html = template
  .replace(/__PROJETO__/g, projeto.replace(/[<>&]/g, ""))
  .replace(/__META__/g, meta)
  .replace("/*__DADOS__*/ null", dados);

const saida = path.join(dirSaida, `relatorio-${hoje}.html`);
fs.writeFileSync(saida, html);

if (!semBaseline) {
  fs.writeFileSync(caminhoBaseline, JSON.stringify({
    data: hoje,
    commit,
    total: findings.length,
    porSeveridade: Object.fromEntries(
      ["critica", "alta", "media", "baixa"].map((s) => [s, findings.filter((f) => f.severidade === s).length])
    ),
    hashes: findings.map(hashDe),
  }, null, 2) + "\n");
}

console.log(`Relatório:  ${path.relative(raiz, saida)}`);
if (delta) console.log(`Delta:      ${delta.resolvidos} resolvidos · ${delta.novos} novos · ${delta.persistem} persistem (desde ${delta.desde})`);
if (!semBaseline) console.log(`Baseline:   ${path.relative(raiz, caminhoBaseline)} atualizado`);

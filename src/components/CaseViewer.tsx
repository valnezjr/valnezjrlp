import { useEffect, useRef, useState } from "react";
import { Loader } from "mothership-ds";
import { BASE, caseUrlFor, pdfUrlFor } from "@/lib/portfolio";
import "./case.css";

// Apresentação do case (docs/architecture.md § Registro de decisões #33)
// — troca o antigo PdfViewer (PDF inteiro renderizado em <canvas> via
// pdf.js, decisões #29/#30) por um fragmento HTML estático pré-gerado
// pelo pipeline próprio de Valnez (catalogo/ → public/portfolio-case/
// {file}.html): mesmo case, mas como página legível/navegável em vez de
// imagem de PDF ampliada. O PDF continua existindo — vira só download
// (botão "Baixar PDF" já vem dentro do próprio fragmento).
//
// O fragmento é buscado como texto (fetch, não <iframe>/import estático
// — cada case pesa uns poucos KB de HTML, não vale entrar no bundle
// principal) e injetado via dangerouslySetInnerHTML: é HTML confiável,
// gerado pelo pipeline do próprio autor (não input de usuário/terceiro),
// então não há superfície de XSS real a mitigar aqui — mesma categoria de
// confiança que os textos de docs/prd.md já teriam se fossem HTML.
//
// Dois tokens são substituídos em runtime antes da injeção, porque o
// arquivo estático não sabe em que ambiente vai ser servido:
//   __CASE_IMG_BASE__ -> BASE + "portfolio-case/img/" (import.meta.env.BASE_URL
//                         muda entre dev e o subpath do GitHub Pages)
//   __CASE_PDF_HREF__ -> pdfUrlFor(file) (mesma escolha desktop/mobile já
//                         usada em qualquer outro lugar do site)
//
// Sem overflow/height próprios no container: .ms-modal__body (mothership-ds)
// já rola sozinho (flex:1, overflow-y:auto) — diferente do PdfViewer, que
// precisava preencher 100% da altura pra empilhar páginas de PDF.
export function CaseViewer({ file, title }: { file: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(caseUrlFor(file));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rawHtml = await res.text();
        const html = rawHtml
          .replaceAll("__CASE_IMG_BASE__", `${BASE}portfolio-case/img/`)
          .replaceAll("__CASE_PDF_HREF__", pdfUrlFor(file));

        if (cancelled) return;
        if (containerRef.current) containerRef.current.innerHTML = html;
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <div style={{ position: "relative", minHeight: "50vh" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader label="Carregando case…" />
        </div>
      )}
      {error && (
        <p className="ms-text-sm ms-text-muted" style={{ textAlign: "center", marginTop: "var(--space-5)" }}>
          Não foi possível carregar a apresentação de {title}. Tente novamente.
        </p>
      )}
      <div ref={containerRef} style={{ visibility: loading ? "hidden" : "visible" }} />
    </div>
  );
}

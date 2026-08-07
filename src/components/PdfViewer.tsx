import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
// Vite-style `?url` import: pega a URL final do worker já processada pelo
// bundler (hash de cache-busting incluso), sem precisar copiar o arquivo
// manualmente pra public/. https://vitejs.dev/guide/assets.html#explicit-url-imports
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Loader } from "mothership-ds";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// Visualizador próprio (canvas, via pdf.js da Mozilla) em vez de
// <iframe src={pdfUrl}> — decisão registrada em docs/architecture.md.
// O iframe dependia do visualizador nativo de PDF do navegador; no
// Chrome Android (e não só lá) isso não existe dentro de iframe, e cai
// num fallback de "baixar o arquivo" em vez de mostrar o PDF. Renderizar
// em canvas funciona igual em qualquer navegador/dispositivo — e de
// quebra dá controle total sobre os links do PDF, que agora sempre
// abrem em nova guia de propósito (rel="noreferrer", mesma convenção já
// usada em Contato.tsx), não por comportamento herdado de visualizador
// nativo que a gente não controla nem consegue testar.
export function PdfViewer({ src, title }: { src: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    setLoading(true);
    setError(null);
    container.replaceChildren();

    (async () => {
      try {
        const doc = await pdfjsLib.getDocument({ url: src }).promise;
        const containerWidth = container.clientWidth;

        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
          if (cancelled) return;
          const page = await doc.getPage(pageNumber);
          const scale = containerWidth / page.getViewport({ scale: 1 }).width;
          const viewport = page.getViewport({ scale });

          const pageEl = document.createElement("div");
          pageEl.style.position = "relative";
          pageEl.style.marginBottom = "var(--space-3)";

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.display = "block";
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.borderRadius = "var(--radius-md)";
          pageEl.append(canvas);

          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          if (cancelled) return;

          // Links do PDF (ex.: "Abrir no Figma →") viram <a> reais
          // posicionados por cima do canvas, na área exata do link
          // original — convertToViewportPoint traduz cada canto do
          // retângulo do PDF (origem embaixo à esquerda) pro espaço do
          // viewport renderizado (origem em cima à esquerda, já na
          // escala usada); sem convertToViewportRectangle nesta versão
          // da lib, os dois cantos precisam ser convertidos à mão.
          const annotations = await page.getAnnotations();
          for (const annotation of annotations) {
            if (annotation.subtype !== "Link" || !annotation.url) continue;
            const [px1, py1, px2, py2] = annotation.rect;
            const [x1, y1] = viewport.convertToViewportPoint(px1, py1);
            const [x2, y2] = viewport.convertToViewportPoint(px2, py2);
            const left = Math.min(x1, x2);
            const top = Math.min(y1, y2);
            const link = document.createElement("a");
            link.href = annotation.url;
            link.target = "_blank";
            link.rel = "noreferrer";
            link.setAttribute("aria-label", `Link externo na página ${pageNumber} de ${title}`);
            link.style.position = "absolute";
            link.style.left = `${(left / viewport.width) * 100}%`;
            link.style.top = `${(top / viewport.height) * 100}%`;
            link.style.width = `${(Math.abs(x2 - x1) / viewport.width) * 100}%`;
            link.style.height = `${(Math.abs(y2 - y1) / viewport.height) * 100}%`;
            pageEl.append(link);
          }

          if (cancelled) return;
          container.append(pageEl);
        }

        if (!cancelled) setLoading(false);
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
  }, [src, title]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
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
          <Loader label="Carregando PDF…" />
        </div>
      )}
      {error && (
        <p className="ms-text-sm ms-text-muted" style={{ textAlign: "center", marginTop: "var(--space-5)" }}>
          Não foi possível carregar o PDF. Tente novamente.
        </p>
      )}
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", overflowY: "auto", visibility: loading ? "hidden" : "visible" }}
      />
    </div>
  );
}

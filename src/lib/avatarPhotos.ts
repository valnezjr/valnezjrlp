// Fotos reais de perfil (ImportPFP/valnez-retratos-v2.zip, 3 poses —
// aberto/contido/joinha — entregues pelo Valnez em 2026-08-22),
// convertidas pra public/avatar/*.jpg (crop "avatar", 800px, já
// enquadrado pro círculo do componente Avatar; variante "busto" do zip
// fica de fora por ora, sem uso na LP ainda). Servidas via BASE_URL
// (import.meta.env.BASE_URL) no mesmo esquema de public/portfolio/thumbs
// (lib/portfolio.ts) — puro <img src>, sem passar pelo bundler.
import { BASE } from "@/lib/portfolio";

export interface AvatarPhoto {
  key: string;
  src: string;
}

const AVATAR_PHOTOS: AvatarPhoto[] = [
  { key: "aberto", src: `${BASE}avatar/valnez-aberto.jpg` },
  { key: "contido", src: `${BASE}avatar/valnez-contido.jpg` },
  { key: "joinha", src: `${BASE}avatar/valnez-joinha.jpg` },
];

const STORAGE_KEY = "valnez-avatar-index";

// Cicla em loop pelas 3 poses a cada visita nova (não a cada render):
// lê o índice usado da última vez em localStorage, avança um e persiste
// — assim quem volta ao site em outra sessão vê uma pose diferente, e
// as 3 se revezam ao longo do tempo em vez de travar sempre na mesma.
// localStorage (não sessionStorage) de propósito: o giro é por
// visitante/navegador, não por aba/sessão.
export function nextAvatarPhoto(): AvatarPhoto {
  if (typeof window === "undefined") return AVATAR_PHOTOS[0];

  let index = 0;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    index = stored != null ? (Number(stored) + 1) % AVATAR_PHOTOS.length : 0;
    if (!Number.isFinite(index) || index < 0) index = 0;
    window.localStorage.setItem(STORAGE_KEY, String(index));
  } catch {
    // localStorage indisponível (modo privado, cookies bloqueados etc.)
    // — cai pra primeira pose, sem cycling, mas sem quebrar a página.
  }

  return AVATAR_PHOTOS[index];
}

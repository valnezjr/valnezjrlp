import { useState, type ComponentType } from "react";
import { Navbar } from "@/components/Navbar";
import type { SectionId } from "@/lib/navigation";
import { Home } from "@/sections/Home";
import { Servicos } from "@/sections/Servicos";
import { Sobre } from "@/sections/Sobre";
import { Contato } from "@/sections/Contato";

// Navegação por estado, sem react-router — decisão registrada em
// docs/architecture.md §3 (página única, sem SSR, sem URLs a
// preservar). A transição de fade entra na Etapa 3.
const SECTION_COMPONENTS: Record<SectionId, ComponentType> = {
  home: Home,
  servicos: Servicos,
  sobre: Sobre,
  contato: Contato,
};

function App() {
  const [active, setActive] = useState<SectionId>("home");
  const ActiveSection = SECTION_COMPONENTS[active];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <Navbar active={active} onNavigate={setActive} />
      <main className="flex-1 overflow-hidden">
        <ActiveSection />
      </main>
    </div>
  );
}

export default App;

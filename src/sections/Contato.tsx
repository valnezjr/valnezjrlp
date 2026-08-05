import { Camera, Mail, MessageCircle } from "lucide-react";
import { ButtonLink, LinkList } from "mothership-ds";
import { SectionShell } from "@/components/SectionShell";

// docs/prd.md §5.4. Sem formulário — só contato direto (decisão:
// formulário não fazia sentido pra esta seção específica, não uma
// remoção do Field/Input/Textarea/Button da lib, que seguem intactos).
// Ícones genéricos do lucide-react (sem logos de marca no pacote):
// MessageCircle pro WhatsApp, Camera pro Instagram — mesma lógica já
// usada aqui antes. Cor de cada link no tom do sistema mais próximo da
// marca (nunca hex solto): --color-success (verde, WhatsApp),
// --color-pink (Instagram), --color-accent (e-mail, neutro).
const CONTACTS = [
  {
    label: "WhatsApp",
    href: "https://wa.me/5584996324823",
    icon: MessageCircle,
    tone: "success",
    external: true,
  },
  {
    label: "E-mail",
    href: "mailto:valn3zjr@gmail.com",
    icon: Mail,
    tone: "accent",
    external: false,
  },
  {
    label: "Instagram",
    href: "https://instagram.com/vraunez",
    icon: Camera,
    tone: "pink",
    external: true,
  },
] as const;

export function Contato() {
  return (
    <SectionShell>
      <div className="w-full max-w-md text-center">
        <h1 className="ms-h1" style={{ marginBottom: "var(--space-2)" }}>
          Vamos conversar?
        </h1>
        <p className="ms-text-sm ms-text-muted" style={{ marginBottom: "var(--space-5)" }}>
          Prefiro atender por WhatsApp — é o canal mais rápido pra tirar dúvidas, alinhar
          escopo ou já começar a conversa sobre o seu projeto.
        </p>
        <LinkList style={{ textAlign: "left" }}>
          {CONTACTS.map(({ label, href, icon: Icon, tone, external }) => (
            <li key={label}>
              <ButtonLink href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
                <Icon
                  aria-hidden="true"
                  size={18}
                  color={`var(--color-${tone})`}
                  style={{ marginRight: "var(--space-2)" }}
                />
                {label}
              </ButtonLink>
            </li>
          ))}
        </LinkList>
      </div>
    </SectionShell>
  );
}

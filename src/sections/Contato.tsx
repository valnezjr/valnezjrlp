import { useState, type FormEvent } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { Alert, Button, ButtonLink, Field, Input, LinkList, Textarea } from "mothership-ds";
import { SectionShell } from "@/components/SectionShell";
import { sendContact } from "@/lib/sendContact";

// docs/prd.md §5.4. Sem backend real ainda — sendContact() (lib/) fica
// isolado pra plugar Formspree/EmailJS/API depois (architecture.md §7).
type Status = "idle" | "sending" | "sent";

export function Contato() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus("sending");
    await sendContact({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
    });
    form.reset();
    setStatus("sent");
  }

  return (
    <SectionShell>
      <div className="grid w-full max-w-3xl grid-cols-1 items-start gap-6 sm:grid-cols-[1.3fr_1fr]">
        <div>
          <h1 className="ms-h1" style={{ marginBottom: "var(--space-3)" }}>
            Vamos conversar?
          </h1>

          {status === "sent" && (
            <div style={{ marginBottom: "var(--space-3)" }}>
              <Alert tone="success" title="Mensagem enviada!">
                Obrigado pelo contato — respondo em breve.
              </Alert>
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Field label="Nome">
              <Input name="name" required autoComplete="name" placeholder="Seu nome" />
            </Field>
            <Field label="E-mail">
              <Input name="email" type="email" required autoComplete="email" placeholder="voce@exemplo.com" />
            </Field>
            <Field label="Mensagem">
              <Textarea name="message" required rows={3} placeholder="Como posso ajudar?" />
            </Field>
            <Button type="submit" variant="solid" disabled={status === "sending"}>
              {status === "sending" ? "Enviando…" : "Enviar mensagem"}
            </Button>
          </form>
        </div>

        <div>
          <p className="ms-text-sm ms-text-muted" style={{ marginBottom: "var(--space-2)" }}>
            Prefere falar direto?
          </p>
          <LinkList>
            <li>
              <ButtonLink href="https://wa.me/5584996324823" target="_blank" rel="noreferrer">
                <MessageCircle aria-hidden="true" size={18} style={{ marginRight: "var(--space-2)" }} />
                WhatsApp
              </ButtonLink>
            </li>
            <li>
              <ButtonLink href="mailto:valn3zjr@gmail.com">
                <Mail aria-hidden="true" size={18} style={{ marginRight: "var(--space-2)" }} />
                E-mail
              </ButtonLink>
            </li>
          </LinkList>
        </div>
      </div>
    </SectionShell>
  );
}

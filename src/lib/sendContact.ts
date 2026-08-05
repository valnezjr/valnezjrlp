export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

/**
 * v1: envio simulado (sem backend) — arquitetura isolada aqui pra
 * plugar o serviço real (Formspree/EmailJS/API própria) depois sem
 * tocar no componente da seção (architecture.md §7).
 */
export async function sendContact(payload: ContactPayload): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.info("[sendContact] simulado:", payload);
}

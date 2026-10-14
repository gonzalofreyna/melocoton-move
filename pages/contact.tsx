import Head from "next/head";
import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus("Completa todos los campos.");
      return;
    }

    try {
      setSending(true);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("¡Mensaje enviado! Te responderemos pronto.");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus(data.message || "No se pudo enviar. Intenta de nuevo.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error de red. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Head>
        <title>Contacto | Melocotón Move</title>
        <meta name="description" content="Contacta al equipo de Melocotón Move para resolver tus dudas sobre productos, pedidos y colaboraciones." />
        <link rel="canonical" href="https://www.melocotonmove.com/contact" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-brand-cream px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="mm-heading mb-6 text-4xl sm:text-5xl">
        Contáctanos
      </h1>
      <p className="text-gray-600 max-w-xl text-center mb-12">
        ¿Tienes alguna pregunta sobre nuestros productos o quieres más
        información? Envíanos un mensaje y te responderemos lo antes posible.
      </p>

      <form
        onSubmit={onSubmit}
        className="mm-card w-full max-w-lg space-y-6 p-6 sm:p-8"
      >
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Nombre
          </label>
          <input
            type="text"
            className="mm-field w-full"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={sending}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Correo electrónico
          </label>
          <input
            type="email"
            className="mm-field w-full"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sending}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Mensaje
          </label>
          <textarea
            rows={5}
            className="mm-field w-full"
            placeholder="Escribe tu mensaje aquí..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="mm-button w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Enviando..." : "Enviar mensaje"}
        </button>

        {status && (
          <p
            className={`text-sm mt-2 ${
              status.includes("¡Mensaje enviado!")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {status}
          </p>
        )}
      </form>
    </main>
    </>
  );
}

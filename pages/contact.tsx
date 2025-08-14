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
    <main className="flex flex-col items-center px-6 py-16 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold text-brand-blue mb-8">
        Contáctanos
      </h1>
      <p className="text-gray-600 max-w-xl text-center mb-12">
        ¿Tienes alguna pregunta sobre nuestros productos o quieres más
        información? Envíanos un mensaje y te responderemos lo antes posible.
      </p>

      <form
        onSubmit={onSubmit}
        className="bg-white shadow-md rounded-xl p-8 w-full max-w-lg space-y-6"
      >
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Nombre
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue focus:outline-none"
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
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue focus:outline-none"
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
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue focus:outline-none"
            placeholder="Escribe tu mensaje aquí..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full bg-brand-blue text-white py-3 rounded-xl font-semibold hover:bg-brand-beige hover:text-brand-blue transition-colors disabled:opacity-50"
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
  );
}

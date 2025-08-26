// pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { name, email, message } = (req.body || {}) as {
    name?: string;
    email?: string;
    message?: string;
  };
  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, message: "Faltan campos" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEnv = process.env.TO_EMAIL;
  if (!apiKey) {
    return res
      .status(500)
      .json({ ok: false, message: "RESEND_API_KEY ausente" });
  }
  if (!toEnv) {
    return res.status(500).json({ ok: false, message: "TO_EMAIL ausente" });
  }

  const to = toEnv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (to.length === 0) {
    return res.status(500).json({ ok: false, message: "TO_EMAIL inválido" });
  }

  const resend = new Resend(apiKey);

  const from = "Melocotón Move <contacto@melocotonmove.com>";
  const subject = "Nuevo mensaje de contacto";
  const text = `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`;
  const html = `
    <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 8px">Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p style="margin:12px 0 4px"><strong>Mensaje:</strong></p>
      <pre style="white-space:pre-wrap;margin:0">${escapeHtml(message)}</pre>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      replyTo: email, // el usuario que llenó el formulario
      subject,
      text,
      html,
    });

    if (error) {
      console.error("❌ Resend error:", error);
      return res.status(502).json({ ok: false, message: stringifyErr(error) });
    }

    return res.status(200).json({ ok: true, id: data?.id, from });
  } catch (e: any) {
    console.error("❌ Unexpected error:", e);
    return res
      .status(500)
      .json({ ok: false, message: e?.message || String(e) });
  }
}

// Helpers
function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ]!)
  );
}
function stringifyErr(err: unknown) {
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export const config = { api: { bodyParser: true } };

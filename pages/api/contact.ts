// pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, message: "Faltan campos" });
  }
  if (!process.env.TO_EMAIL) {
    return res.status(500).json({ ok: false, message: "TO_EMAIL ausente" });
  }

  try {
    const { data, error } = await resend.emails.send({
      // Ahora que el dominio está verificado usamos tu correo oficial
      from: "Melocotón Move <contacto@melocotonmove.com>",
      to: process.env.TO_EMAIL,
      replyTo: email,
      subject: "Nuevo mensaje de contacto",
      text: `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`,
    });

    if (error) {
      console.error("❌ Resend error:", error);
      return res.status(500).json({ ok: false, message: String(error) });
    }

    console.log("✅ Resend data:", data); // Trae el id del correo
    return res.status(200).json({ ok: true, id: data?.id });
  } catch (e: any) {
    console.error("❌ Unexpected error:", e);
    return res
      .status(500)
      .json({ ok: false, message: e?.message || "Error interno" });
  }
}

// ================================================================
//  Edge Function: enviar-reporte
//  Envía por correo (Zoho SMTP) el Excel y el PDF del mes.
//  Secrets necesarios (Supabase → Edge Functions → Secrets):
//    ZOHO_USER = correo Zoho remitente (ej. reportes@tuempresa.com)
//    ZOHO_PASS = contraseña de aplicación de Zoho (App Password)
// ================================================================
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { to, subject, empleado, periodo, xlsxName, xlsxB64, pdfName, pdfB64 } = await req.json();
    if (!to) throw new Error("Falta el correo de destino.");

    const user = Deno.env.get("ZOHO_USER");
    const pass = Deno.env.get("ZOHO_PASS");
    if (!user || !pass) throw new Error("Faltan las claves ZOHO_USER / ZOHO_PASS.");

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.zoho.com",
        port: 465,
        tls: true,
        auth: { username: user, password: pass },
      },
    });

    await client.send({
      from: user,
      to,
      subject: subject || "Reporte de horas",
      content: `Adjunto el reporte de horas de ${empleado ?? ""} correspondiente a ${periodo ?? ""}.\n\nSe adjuntan el archivo Excel y el PDF.\n\n— Brighter WorkLog`,
      attachments: [
        { filename: xlsxName || "reporte.xlsx", encoding: "base64", content: xlsxB64,
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        { filename: pdfName || "reporte.pdf", encoding: "base64", content: pdfB64,
          contentType: "application/pdf" },
      ],
    });
    await client.close();

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

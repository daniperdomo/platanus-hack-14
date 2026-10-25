// Canjea el requestId del SDK con el client secret, que nunca llega al navegador.
const API_URL = process.env.ZEROID_API_URL ?? "http://localhost:8000";

export async function POST(request) {
  const clientId = process.env.NEXT_PUBLIC_ZEROID_CLIENT_ID;
  const secret = process.env.ZEROID_CLIENT_SECRET;
  if (!clientId || !secret) {
    return Response.json({ detail: "Expreso Caribe no tiene configuradas sus credenciales de ZeroID." }, { status: 500 });
  }

  const { requestId } = await request.json().catch(() => ({}));
  if (typeof requestId !== "string" || !requestId) {
    return Response.json({ detail: "Falta el requestId." }, { status: 400 });
  }

  let response;
  try {
    response = await fetch(`${API_URL}/clients/${encodeURIComponent(clientId)}/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ request_id: requestId }),
      cache: "no-store",
    });
  } catch {
    return Response.json({ detail: "No pudimos conectar con ZeroID." }, { status: 502 });
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) return Response.json(result, { status: response.status });
  if (result.status !== "delivered") {
    return Response.json({ detail: "El usuario no aprobó el inicio de sesión." }, { status: 401 });
  }
  return Response.json({ subject: result.subject, claims: result.claims });
}

// Documentación del SDK que se entrega a cada empresa al aprobar su solicitud de API.
// Se arma como secciones para exportarla igual a Markdown y a HTML imprimible.

const SCOPES = [
  ["persona_real_unica", "Es una persona real con una sola cuenta ZeroID.", "true"],
  ["mayor_de_edad", "Cumplió la mayoría de edad. No revela la fecha de nacimiento.", "true / false"],
  ["nacionalidad", "País de nacionalidad (ISO 3166 alfa-2).", '"CL"'],
];

export function buildSdkGuide({ companyName, clientId, origins, zeroidUrl, apiUrl, issuedAt }) {
  const exchangeUrl = `${apiUrl}/clients/${clientId}/exchange`;
  const jwksUrl = `${apiUrl}/.well-known/jwks.json`;

  return {
    title: `ZeroID SDK · Guía de integración para ${companyName}`,
    meta: [
      ["Client ID", clientId],
      ["Dominios autorizados", origins.join(", ")],
      ["Emitida", issuedAt],
      ["Versión del SDK", "1.0.0"],
    ],
    sections: [
      {
        title: "1. Qué obtiene tu sitio",
        blocks: [
          {
            type: "p",
            text:
              "Con “Continuar con ZeroID” tus usuarios inician sesión confirmando desde su teléfono, con huella o rostro. Por defecto tu sitio no recibe nombre, correo, teléfono ni documento; si los pides, el usuario decide cuáles compartir.",
          },
          {
            type: "list",
            items: [
              "subject: un identificador seudónimo y estable. La misma persona siempre tiene el mismo subject en tu sitio, pero uno distinto en cada otro sitio, así que nadie puede cruzar bases de datos.",
              "claims: solo las pruebas que pediste (por ejemplo, que es una persona real y única).",
              "token: un JWT firmado por el oráculo de ZeroID (RS256) con esos mismos datos, por si quieres guardarlo como evidencia.",
            ],
          },
        ],
      },
      {
        title: "2. Cómo funciona",
        blocks: [
          {
            type: "ol",
            items: [
              "El usuario pulsa el botón en tu sitio y se abre una ventana de ZeroID.",
              "Escribe su usuario de ZeroID en esa ventana (tu sitio no lo ve) o escanea un QR con la app.",
              "ZeroID envía una notificación a su teléfono. El usuario confirma con biometría y la app firma la aprobación con una llave que nunca sale del teléfono.",
              "La ventana se cierra y tu frontend recibe un requestId.",
              "Tu backend canjea el requestId con tu client secret y obtiene subject y claims.",
            ],
          },
        ],
      },
      {
        title: "3. Instala el SDK",
        blocks: [
          { type: "p", text: "Agrega el script en las páginas donde quieras el botón:" },
          {
            type: "code",
            lang: "html",
            text: `<script src="${zeroidUrl}/sdk/zeroid.js"></script>`,
          },
        ],
      },
      {
        title: "4. Muestra el botón",
        blocks: [
          {
            type: "code",
            lang: "html",
            text: `<div id="zeroid-login"></div>
<script>
  ZeroID.init({
    clientId: "${clientId}",
    scopes: ["persona_real_unica"],
  });

  ZeroID.renderButton("#zeroid-login", {
    theme: "dark",
    onSuccess: async ({ requestId }) => {
      const response = await fetch("/api/zeroid/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (response.ok) window.location.href = "/cuenta";
    },
    onError: (error) => console.warn(error.code, error.message),
  });
</script>`,
          },
          {
            type: "p",
            text:
              "Si prefieres tu propio botón, llama a ZeroID.signIn() en su evento click. Devuelve una promesa con { requestId, clientId }.",
          },
        ],
      },
      {
        title: "5. Canjea el requestId en tu backend",
        blocks: [
          {
            type: "p",
            text:
              "El canje necesita tu client secret, así que hazlo siempre desde el servidor. Cada requestId se canjea una sola vez.",
          },
          {
            type: "code",
            lang: "js",
            text: `// Node.js 18+ (Express)
app.post("/api/zeroid/callback", async (req, res) => {
  const response = await fetch("${exchangeUrl}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: \`Bearer \${process.env.ZEROID_CLIENT_SECRET}\`,
    },
    body: JSON.stringify({ request_id: req.body.requestId }),
  });
  const result = await response.json();
  if (result.status !== "delivered") return res.status(401).json(result);

  // result.subject identifica a la persona en tu sitio.
  const user = await users.findOrCreate({ zeroidSubject: result.subject });
  req.session.userId = user.id;
  res.json({ ok: true });
});`,
          },
          {
            type: "code",
            lang: "python",
            text: `# Python (requests)
import os, requests

def zeroid_callback(request_id: str) -> dict:
    response = requests.post(
        "${exchangeUrl}",
        json={"request_id": request_id},
        headers={"Authorization": f"Bearer {os.environ['ZEROID_CLIENT_SECRET']}"},
        timeout=10,
    )
    result = response.json()
    if result.get("status") != "delivered":
        raise PermissionError(result)
    return result  # {"subject": "...", "claims": {...}, "token": "..."}`,
          },
          {
            type: "p",
            text: "Respuesta cuando el usuario aprobó:",
          },
          {
            type: "code",
            lang: "json",
            text: `{
  "status": "delivered",
  "subject": "4f0c9e…",
  "claims": { "persona_real_unica": true },
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6Inplcm9pZC1vcmFjdWxvLTEi…"
}`,
          },
        ],
      },
      {
        title: "6. Verifica el token (opcional)",
        blocks: [
          {
            type: "p",
            text: `El token está firmado con RS256. Publicamos la llave en ${jwksUrl}. Comprueba iss = "zeroid-oraculo" y aud = tu client ID. Caduca a los 10 minutos.`,
          },
          {
            type: "code",
            lang: "js",
            text: `import { createRemoteJWKSet, jwtVerify } from "jose";

const jwks = createRemoteJWKSet(new URL("${jwksUrl}"));
const { payload } = await jwtVerify(result.token, jwks, {
  issuer: "zeroid-oraculo",
  audience: "${clientId}",
});`,
          },
        ],
      },
      {
        title: "7. Referencia",
        blocks: [
          { type: "h3", text: "Pruebas disponibles (scopes)" },
          {
            type: "table",
            head: ["Scope", "Qué confirma", "Valor"],
            rows: SCOPES,
          },
          {
            type: "p",
            text:
              "Los scopes solo admiten pruebas. Si necesitas datos personales (por ejemplo, el nombre para emitir un boleto), pídelos en fields con su propósito y retención. El usuario los revisa en su teléfono y decide cuáles compartir; llegan en claims al canjear.",
          },
          {
            type: "code",
            lang: "js",
            text: `ZeroID.signIn({
  fields: [
    { field: "nombre", purpose: "Emitir tu boleto.", retention: "1 año tras el viaje." },
    { field: "telefono", purpose: "Avisarte de retrasos.", required: false },
  ],
});`,
          },
          {
            type: "p",
            text: "Datos disponibles en fields: nombre, documento, email, telefono, fecha_nacimiento, direccion. purpose es obligatorio.",
          },
          { type: "h3", text: "ZeroID.init(options)" },
          {
            type: "table",
            head: ["Opción", "Tipo", "Descripción"],
            rows: [
              ["clientId", "string", "Obligatorio. Tu client ID."],
              ["scopes", "string[]", 'Pruebas a pedir. Por defecto ["persona_real_unica"].'],
              ["fields", "{ field, purpose, retention?, required? }[]", "Datos personales a pedir. Por defecto ninguno."],
            ],
          },
          { type: "h3", text: "ZeroID.renderButton(target, options)" },
          {
            type: "table",
            head: ["Opción", "Tipo", "Descripción"],
            rows: [
              ["label", "string", 'Texto del botón. Por defecto "Continuar con ZeroID".'],
              ["theme", '"dark" | "light"', "Colores del botón."],
              ["scopes", "string[]", "Sobrescribe los scopes de init para este botón."],
              ["fields", "object[]", "Sobrescribe los fields de init para este botón."],
              ["onSuccess", "({ requestId, clientId }) => void", "El usuario aprobó."],
              ["onError", "(error) => void", "error.code indica el motivo."],
            ],
          },
          { type: "h3", text: "Códigos de error del SDK" },
          {
            type: "table",
            head: ["error.code", "Significado"],
            rows: [
              ["rejected", "El usuario rechazó desde su teléfono."],
              ["closed", "El usuario cerró la ventana de ZeroID."],
              ["expired", "Pasaron 5 minutos sin respuesta."],
              ["popup_blocked", "El navegador bloqueó la ventana. Llama a signIn() desde un click."],
              ["config", "Falta llamar a ZeroID.init con tu clientId."],
              ["server", "ZeroID no pudo completar la solicitud."],
            ],
          },
          { type: "h3", text: `POST ${exchangeUrl}` },
          {
            type: "table",
            head: ["Respuesta", "Significado"],
            rows: [
              ['200 status "delivered"', "Aprobado. Incluye subject, claims y token."],
              ['200 status "pending"', "El usuario aún no responde."],
              ['200 status "rejected"', "El usuario rechazó."],
              ["401", "Client secret inválido."],
              ["404", "El requestId no existe o es de otra aplicación."],
              ["410", "Expiró o ya fue canjeado."],
            ],
          },
        ],
      },
      {
        title: "8. Seguridad",
        blocks: [
          {
            type: "list",
            items: [
              "Guarda el client secret en una variable de entorno del servidor. Nunca lo publiques en el frontend ni en el repositorio.",
              "El botón solo funciona en los dominios autorizados. Para agregar otro, escríbenos.",
              "Usa subject como llave del usuario en tu base. No intentes derivar datos personales de él.",
              "Para pruebas locales puedes registrar http://localhost con el puerto que uses.",
            ],
          },
        ],
      },
    ],
  };
}

function fence(block) {
  return `\`\`\`${block.lang}\n${block.text}\n\`\`\``;
}

function markdownTable(head, rows) {
  const line = (cells) => `| ${cells.map((cell) => String(cell).replace(/\|/g, "\\|")).join(" | ")} |`;
  return [line(head), line(head.map(() => "---")), ...rows.map(line)].join("\n");
}

export function guideToMarkdown(guide) {
  const parts = [`# ${guide.title}`, markdownTable(["Dato", "Valor"], guide.meta)];
  for (const section of guide.sections) {
    parts.push(`## ${section.title}`);
    for (const block of section.blocks) {
      if (block.type === "p") parts.push(block.text);
      if (block.type === "h3") parts.push(`### ${block.text}`);
      if (block.type === "list") parts.push(block.items.map((item) => `- ${item}`).join("\n"));
      if (block.type === "ol") parts.push(block.items.map((item, i) => `${i + 1}. ${item}`).join("\n"));
      if (block.type === "code") parts.push(fence(block));
      if (block.type === "table") parts.push(markdownTable(block.head, block.rows));
    }
  }
  return `${parts.join("\n\n")}\n`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlTable(head, rows) {
  const cells = (items, tag) => items.map((item) => `<${tag}>${escapeHtml(item)}</${tag}>`).join("");
  return `<table><thead><tr>${cells(head, "th")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${cells(row, "td")}</tr>`)
    .join("")}</tbody></table>`;
}

const PRINT_STYLES = `
  body { font: 14px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; color: #111; max-width: 820px; margin: 40px auto; padding: 0 24px; }
  h1 { font-size: 26px; letter-spacing: -0.02em; margin-bottom: 16px; }
  h2 { font-size: 18px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e2e2; }
  h3 { font-size: 14px; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.06em; color: #555; }
  pre { background: #0d0e11; color: #f5f5f5; padding: 14px 16px; border-radius: 8px; overflow-x: auto; font: 12px/1.5 ui-monospace, Menlo, Consolas, monospace; white-space: pre-wrap; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; font-size: 13px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e2e2; vertical-align: top; }
  th { color: #555; font-weight: 600; }
  .meta td:first-child { width: 180px; color: #555; }
  .toolbar { position: sticky; top: 0; background: #fff; padding: 8px 0 16px; }
  .toolbar button { font: 600 14px system-ui; padding: 8px 16px; border-radius: 999px; border: 1px solid #111; background: #111; color: #fff; cursor: pointer; }
  @media print { .toolbar { display: none; } h2 { break-after: avoid; } pre, table { break-inside: avoid; } }
`;

export function guideToHtml(guide) {
  const body = [
    `<div class="toolbar"><button onclick="window.print()">Imprimir o guardar como PDF</button></div>`,
    `<h1>${escapeHtml(guide.title)}</h1>`,
    `<table class="meta"><tbody>${guide.meta
      .map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td><code>${escapeHtml(value)}</code></td></tr>`)
      .join("")}</tbody></table>`,
  ];
  for (const section of guide.sections) {
    body.push(`<h2>${escapeHtml(section.title)}</h2>`);
    for (const block of section.blocks) {
      if (block.type === "p") body.push(`<p>${escapeHtml(block.text)}</p>`);
      if (block.type === "h3") body.push(`<h3>${escapeHtml(block.text)}</h3>`);
      if (block.type === "list") body.push(`<ul>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`);
      if (block.type === "ol") body.push(`<ol>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ol>`);
      if (block.type === "code") body.push(`<pre><code>${escapeHtml(block.text)}</code></pre>`);
      if (block.type === "table") body.push(htmlTable(block.head, block.rows));
    }
  }
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(
    guide.title
  )}</title><style>${PRINT_STYLES}</style></head><body>${body.join("\n")}</body></html>`;
}

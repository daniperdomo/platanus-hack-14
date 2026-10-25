// Configuración del formulario de solicitud de API para empresas.

export const COUNTRIES = [
  "Venezuela",
  "Argentina",
  "Bolivia",
  "Brasil",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Ecuador",
  "España",
  "Estados Unidos",
  "México",
  "Panamá",
  "Perú",
  "República Dominicana",
  "Uruguay",
  "Otro",
];

export const SECTORS = [
  "Comercio electrónico",
  "Finanzas y pagos",
  "Transporte y movilidad",
  "Salud",
  "Educación",
  "Entretenimiento y medios",
  "Telecomunicaciones",
  "Gobierno",
  "Tecnología / SaaS",
  "Otro",
];

export const SIZES = ["1-10", "11-50", "51-200", "201-1.000", "Más de 1.000"];

export const MAX_FILE_MB = 10;
export const ACCEPTED_TYPES = ".pdf,.doc,.docx";
const ACCEPTED_EXTENSIONS = ["pdf", "doc", "docx"];

// Solo la política de privacidad y el registro de tratamiento son obligatorios; el resto
// mejora el Trust Score pero no bloquea la solicitud.
export const DOCUMENTS = [
  {
    key: "politica_privacidad",
    title: "Política de privacidad",
    description: "La versión vigente que publican para sus usuarios.",
    required: true,
  },
  {
    key: "registro_tratamiento",
    title: "Registro de actividades de tratamiento",
    description:
      "Inventario de cada dato personal: propósito, base legal, plazo de retención y destinatarios.",
    required: true,
  },
  {
    key: "retencion",
    title: "Política de retención y eliminación",
    description: "Cuánto tiempo conservan cada dato y cómo lo eliminan.",
    required: false,
  },
  {
    key: "seguridad",
    title: "Política de seguridad de la información",
    description: "Cifrado, control de accesos, respaldos y gestión de proveedores.",
    required: false,
  },
  {
    key: "incidentes",
    title: "Plan de respuesta a incidentes e historial de brechas",
    description:
      "Procedimiento de notificación y brechas ocurridas en los últimos 3 años (o declaración de que no hubo).",
    required: false,
  },
  {
    key: "derechos",
    title: "Procedimiento de derechos del titular",
    description:
      "Canales y plazos para que el usuario acceda, corrija, porte o elimine sus datos.",
    required: false,
  },
  {
    key: "terceros",
    title: "Encargados, contratos y transferencias",
    description:
      "Lista de proveedores que procesan datos, sus contratos (DPA) y transferencias internacionales.",
    required: false,
  },
  {
    key: "dpia",
    title: "Evaluación de impacto (DPIA)",
    description: "Análisis de riesgos de los tratamientos de datos sensibles. Recomendado si piden documento o biometría.",
    required: false,
  },
  {
    key: "certificaciones",
    title: "Certificaciones y auditorías",
    description: "ISO 27001, ISO 27701, SOC 2 u otras auditorías externas vigentes.",
    required: false,
    multiple: true,
  },
];

export function isDocumentRequired(document, sensitive) {
  return document.required === true || (document.required === "sensitive" && sensitive);
}

export function fileError(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(extension)) return "Solo se aceptan PDF o Word.";
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `El archivo supera ${MAX_FILE_MB} MB.`;
  return null;
}

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value) {
  return EMAIL.test(value.trim());
}

export function isHttpsUrl(value) {
  try {
    return new URL(value.trim()).protocol === "https:";
  } catch {
    return false;
  }
}

const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

export function isAllowedOrigin(value) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || (url.protocol === "http:" && LOCAL_HOSTS.includes(url.hostname));
  } catch {
    return false;
  }
}

export function parseDomains(text) {
  return text.split("\n").map((domain) => domain.trim()).filter(Boolean);
}

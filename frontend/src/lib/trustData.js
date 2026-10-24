// Datos de demostración del Trust Score. Los puntajes son ilustrativos: el scraper
// todavía no está conectado. Los incidentes listados son hechos públicos conocidos.

export const DIMENSIONS = [
  {
    key: "privacidad",
    label: "Privacidad",
    weight: 0.25,
    description: "Qué tan clara y respetuosa es su política de privacidad.",
  },
  {
    key: "seguridad",
    label: "Seguridad",
    weight: 0.25,
    description: "Historial de brechas y filtraciones de datos.",
  },
  {
    key: "transparencia",
    label: "Transparencia",
    weight: 0.2,
    description: "Si declara para qué usa cada dato y con quién lo comparte.",
  },
  {
    key: "minimizacion",
    label: "Minimización",
    weight: 0.15,
    description: "Si pide solo los datos que necesita para operar.",
  },
  {
    key: "derechos",
    label: "Derechos del usuario",
    weight: 0.15,
    description: "Facilidad para descargar, corregir o borrar tus datos.",
  },
];

export const CATEGORIES = [
  "Todas",
  "Redes sociales",
  "Tecnología",
  "Comercio",
  "Finanzas",
  "Transporte",
  "Entretenimiento",
];

const companies = [
  {
    id: "apple",
    name: "Apple",
    domain: "apple.com",
    category: "Tecnología",
    trend: 2,
    scores: { privacidad: 90, seguridad: 85, transparencia: 84, minimizacion: 82, derechos: 88 },
    collects: ["Nombre", "Correo", "Pagos", "Ubicación aproximada", "Uso de dispositivos"],
    incidents: [],
  },
  {
    id: "spotify",
    name: "Spotify",
    domain: "spotify.com",
    category: "Entretenimiento",
    trend: 0,
    scores: { privacidad: 74, seguridad: 80, transparencia: 76, minimizacion: 70, derechos: 82 },
    collects: ["Correo", "Fecha de nacimiento", "Historial de escucha", "Pagos"],
    incidents: [],
  },
  {
    id: "microsoft",
    name: "Microsoft",
    domain: "microsoft.com",
    category: "Tecnología",
    trend: -1,
    scores: { privacidad: 76, seguridad: 70, transparencia: 78, minimizacion: 68, derechos: 84 },
    collects: ["Nombre", "Correo", "Teléfono", "Telemetría", "Pagos"],
    incidents: [],
  },
  {
    id: "paypal",
    name: "PayPal",
    domain: "paypal.com",
    category: "Finanzas",
    trend: 1,
    scores: { privacidad: 72, seguridad: 74, transparencia: 70, minimizacion: 62, derechos: 76 },
    collects: ["Nombre", "Documento", "Dirección", "Cuentas bancarias", "Historial de pagos"],
    incidents: [],
  },
  {
    id: "netflix",
    name: "Netflix",
    domain: "netflix.com",
    category: "Entretenimiento",
    trend: 0,
    scores: { privacidad: 70, seguridad: 78, transparencia: 68, minimizacion: 66, derechos: 74 },
    collects: ["Correo", "Pagos", "Historial de visualización", "Dispositivos"],
    incidents: [],
  },
  {
    id: "airbnb",
    name: "Airbnb",
    domain: "airbnb.com",
    category: "Transporte",
    trend: 3,
    scores: { privacidad: 66, seguridad: 72, transparencia: 70, minimizacion: 54, derechos: 72 },
    collects: ["Nombre", "Documento", "Selfie", "Teléfono", "Pagos", "Ubicación"],
    incidents: [],
  },
  {
    id: "mercadolibre",
    name: "Mercado Libre",
    domain: "mercadolibre.com",
    category: "Comercio",
    trend: -2,
    scores: { privacidad: 64, seguridad: 60, transparencia: 66, minimizacion: 58, derechos: 68 },
    collects: ["Nombre", "Documento", "Dirección", "Teléfono", "Pagos", "Historial de compras"],
    incidents: [{ year: 2022, text: "Acceso no autorizado a datos de unos 300.000 usuarios." }],
  },
  {
    id: "amazon",
    name: "Amazon",
    domain: "amazon.com",
    category: "Comercio",
    trend: -1,
    scores: { privacidad: 54, seguridad: 70, transparencia: 58, minimizacion: 48, derechos: 70 },
    collects: ["Nombre", "Dirección", "Pagos", "Historial de compras", "Grabaciones de voz"],
    incidents: [{ year: 2021, text: "Multa de 746 M€ en Luxemburgo por publicidad basada en datos personales (GDPR)." }],
  },
  {
    id: "google",
    name: "Google",
    domain: "google.com",
    category: "Tecnología",
    trend: 1,
    scores: { privacidad: 50, seguridad: 82, transparencia: 62, minimizacion: 40, derechos: 80 },
    collects: ["Nombre", "Correo", "Teléfono", "Ubicación", "Historial de búsqueda", "Contactos"],
    incidents: [{ year: 2019, text: "Multa de 50 M€ de la CNIL por falta de transparencia en el consentimiento." }],
  },
  {
    id: "uber",
    name: "Uber",
    domain: "uber.com",
    category: "Transporte",
    trend: 2,
    scores: { privacidad: 56, seguridad: 42, transparencia: 58, minimizacion: 50, derechos: 66 },
    collects: ["Nombre", "Teléfono", "Ubicación en tiempo real", "Pagos", "Historial de viajes"],
    incidents: [
      { year: 2016, text: "Brecha que expuso datos de 57 millones de usuarios y conductores, ocultada por un año." },
      { year: 2022, text: "Intrusión en sistemas internos tras robo de credenciales de un contratista." },
    ],
  },
  {
    id: "x",
    name: "X (Twitter)",
    domain: "x.com",
    category: "Redes sociales",
    trend: -4,
    scores: { privacidad: 46, seguridad: 40, transparencia: 44, minimizacion: 50, derechos: 58 },
    collects: ["Correo", "Teléfono", "Ubicación", "Contactos", "Mensajes"],
    incidents: [{ year: 2022, text: "Filtración de datos de 5,4 millones de cuentas por una vulnerabilidad de la API." }],
  },
  {
    id: "tiktok",
    name: "TikTok",
    domain: "tiktok.com",
    category: "Redes sociales",
    trend: -2,
    scores: { privacidad: 36, seguridad: 52, transparencia: 38, minimizacion: 34, derechos: 56 },
    collects: ["Fecha de nacimiento", "Teléfono", "Ubicación", "Contactos", "Biometría facial y de voz"],
    incidents: [{ year: 2023, text: "Multa de 345 M€ en Irlanda por el manejo de datos de menores (GDPR)." }],
  },
  {
    id: "meta",
    name: "Meta (Facebook)",
    domain: "facebook.com",
    category: "Redes sociales",
    trend: -3,
    scores: { privacidad: 32, seguridad: 38, transparencia: 42, minimizacion: 30, derechos: 62 },
    collects: ["Nombre", "Teléfono", "Ubicación", "Contactos", "Intereses", "Actividad fuera de la app"],
    incidents: [
      { year: 2021, text: "Publicación de datos de 533 millones de usuarios obtenidos por scraping." },
      { year: 2023, text: "Multa récord de 1.200 M€ por transferir datos de europeos a EE. UU. (GDPR)." },
    ],
  },
];

export function trustScore(scores) {
  return Math.round(
    DIMENSIONS.reduce((total, dimension) => total + scores[dimension.key] * dimension.weight, 0)
  );
}

export const LEVELS = [
  { min: 80, grade: "A", label: "Confiable", tone: "good", icon: "✓" },
  { min: 65, grade: "B", label: "Aceptable", tone: "warning", icon: "!" },
  { min: 50, grade: "C", label: "Riesgo moderado", tone: "serious", icon: "▲" },
  { min: 0, grade: "D", label: "Alto riesgo", tone: "critical", icon: "✕" },
];

export function levelFor(score) {
  return LEVELS.find((level) => score >= level.min);
}

export const trustCompanies = companies.map((company) => ({
  ...company,
  score: trustScore(company.scores),
}));

export const lastScan = "2026-10-24 06:00";
export const sourcesCount = 1284;

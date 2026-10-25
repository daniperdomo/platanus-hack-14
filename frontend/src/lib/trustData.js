// Contrato mock unificado con la app móvil. Jesús conectará el scraper después.
// Escala de grados: A | B | C | D. Company.policies: PolicyPoint[].

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

export const POLICY_STATUS_LABEL = {
  required: "REQUERIDO",
  optional: "OPCIONAL",
  zkp: "HASH ZKP",
  ignored: "IGNORADO",
};

function policy(category, label, status, reason, retentionDays) {
  return { category, label, status, reason, retentionDays };
}

const companies = [
  {
    id: "apple",
    name: "Apple",
    domain: "apple.com",
    category: "Tecnología",
    trend: 2,
    scores: { privacidad: 90, seguridad: 85, transparencia: 84, minimizacion: 82, derechos: 88 },
    signatureAlgorithm: "ES256",
    incidents: [],
    policies: [
      policy("Identidad", "Nombre", "zkp", "Confirma tu Apple ID sin almacenar el nombre en claro.", 0),
      policy("Contacto", "Correo", "optional", "Recibos, recuperación de cuenta y avisos de seguridad.", 365),
      policy("Finanzas", "Pagos", "required", "Procesa compras en App Store e iCloud.", 1825),
      policy("Ubicación", "Ubicación aproximada", "ignored", "Sugerencias locales. No se usa para anuncios.", 0),
      policy("Dispositivo", "Uso de dispositivos", "zkp", "Hash del dispositivo para Find My y continuidad.", 90),
    ],
  },
  {
    id: "spotify",
    name: "Spotify",
    domain: "spotify.com",
    category: "Entretenimiento",
    trend: 0,
    scores: { privacidad: 74, seguridad: 80, transparencia: 76, minimizacion: 70, derechos: 82 },
    signatureAlgorithm: "RS256",
    incidents: [],
    policies: [
      policy("Contacto", "Correo", "zkp", "Inicia sesión y recupera la cuenta con un hash verificable.", 0),
      policy("Identidad", "Fecha de nacimiento", "optional", "Restringe contenido y recomendaciones por edad.", 365),
      policy("Comportamiento", "Historial de escucha", "optional", "Personaliza playlists y la radio.", 540),
      policy("Finanzas", "Pagos", "required", "Cobra la suscripción Premium y valida el medio de pago.", 1825),
    ],
  },
  {
    id: "microsoft",
    name: "Microsoft",
    domain: "microsoft.com",
    category: "Tecnología",
    trend: -1,
    scores: { privacidad: 76, seguridad: 70, transparencia: 78, minimizacion: 68, derechos: 84 },
    signatureAlgorithm: "RS256",
    incidents: [],
    policies: [
      policy("Identidad", "Nombre", "zkp", "Muestra tu perfil de cuenta sin persistir el nombre en claro.", 0),
      policy("Contacto", "Correo", "required", "Identificador principal de la cuenta Microsoft.", 365),
      policy("Contacto", "Teléfono", "optional", "Segundo factor y recuperación de acceso.", 365),
      policy("Dispositivo", "Telemetría", "ignored", "Diagnóstico opcional del sistema. Se puede desactivar.", 90),
      policy("Finanzas", "Pagos", "required", "Factura Microsoft 365, Xbox y la Store.", 1825),
    ],
  },
  {
    id: "paypal",
    name: "PayPal",
    domain: "paypal.com",
    category: "Finanzas",
    trend: 1,
    scores: { privacidad: 72, seguridad: 74, transparencia: 70, minimizacion: 62, derechos: 76 },
    signatureAlgorithm: "RS256",
    incidents: [],
    policies: [
      policy("Identidad", "Nombre", "required", "Titular de la cuenta para cumplimiento KYC.", 2555),
      policy("Identidad", "Documento", "required", "Verificación de identidad exigida por regulación financiera.", 2555),
      policy("Identidad", "Dirección", "required", "Domicilio fiscal y prevención de fraude.", 2555),
      policy("Finanzas", "Cuentas bancarias", "required", "Origen y destino de transferencias.", 2555),
      policy("Comportamiento", "Historial de pagos", "optional", "Detecta patrones de fraude y disputa cobros.", 1825),
    ],
  },
  {
    id: "netflix",
    name: "Netflix",
    domain: "netflix.com",
    category: "Entretenimiento",
    trend: 0,
    scores: { privacidad: 70, seguridad: 78, transparencia: 68, minimizacion: 66, derechos: 74 },
    signatureAlgorithm: "RS256",
    incidents: [],
    policies: [
      policy("Contacto", "Correo", "zkp", "Acceso a la cuenta sin exponer el correo en claro a terceros.", 0),
      policy("Finanzas", "Pagos", "required", "Cobra la suscripción mensual.", 1825),
      policy("Comportamiento", "Historial de visualización", "optional", "Continúa viendo y recomienda títulos.", 365),
      policy("Dispositivo", "Dispositivos", "ignored", "Controla el límite de pantallas simultáneas.", 90),
    ],
  },
  {
    id: "airbnb",
    name: "Airbnb",
    domain: "airbnb.com",
    category: "Transporte",
    trend: 3,
    scores: { privacidad: 66, seguridad: 72, transparencia: 70, minimizacion: 54, derechos: 72 },
    signatureAlgorithm: "RS256",
    incidents: [],
    policies: [
      policy("Identidad", "Nombre", "zkp", "Confirma que eres una persona real ante el anfitrión.", 0),
      policy("Identidad", "Documento", "required", "Verificación de identidad de huéspedes y anfitriones.", 730),
      policy("Biometría", "Selfie", "required", "Compara el documento con tu rostro al verificar la cuenta.", 90),
      policy("Contacto", "Teléfono", "optional", "Coordinación de llegadas y soporte.", 365),
      policy("Finanzas", "Pagos", "required", "Cobra reservas y retiene depósitos.", 1825),
      policy("Ubicación", "Ubicación", "ignored", "Muestra estancias cercanas. No se rastrea en segundo plano.", 0),
    ],
  },
  {
    id: "mercadolibre",
    name: "Mercado Libre",
    domain: "mercadolibre.com",
    category: "Comercio",
    trend: -2,
    scores: { privacidad: 64, seguridad: 60, transparencia: 66, minimizacion: 58, derechos: 68 },
    signatureAlgorithm: "RS256",
    incidents: [{ year: 2022, text: "Acceso no autorizado a datos de unos 300.000 usuarios." }],
    policies: [
      policy("Identidad", "Nombre", "required", "Emite facturas y contratos de compraventa.", 1095),
      policy("Identidad", "Documento", "required", "KYC de Mercado Pago y vendedores.", 1095),
      policy("Identidad", "Dirección", "required", "Entrega de pedidos y cálculo de envío.", 1095),
      policy("Contacto", "Teléfono", "optional", "Avisos de envío y soporte del comprador.", 365),
      policy("Finanzas", "Pagos", "required", "Procesa cobros y retenciones de Mercado Pago.", 1825),
      policy("Comportamiento", "Historial de compras", "optional", "Recomendaciones y reputación de la cuenta.", 730),
    ],
  },
  {
    id: "amazon",
    name: "Amazon",
    domain: "amazon.com",
    category: "Comercio",
    trend: -1,
    scores: { privacidad: 54, seguridad: 70, transparencia: 58, minimizacion: 48, derechos: 70 },
    signatureAlgorithm: "RS256",
    incidents: [
      { year: 2021, text: "Multa de 746 M€ en Luxemburgo por publicidad basada en datos personales (GDPR)." },
    ],
    policies: [
      policy("Identidad", "Nombre", "required", "Titular del pedido y de la factura.", 1095),
      policy("Identidad", "Dirección", "required", "Entrega física y zonas de envío Prime.", 1095),
      policy("Finanzas", "Pagos", "required", "Cobra pedidos y suscripciones Prime.", 1825),
      policy("Comportamiento", "Historial de compras", "optional", "Recomendaciones y remarketing.", 1095),
      policy("Biometría", "Grabaciones de voz", "ignored", "Alexa. Se puede borrar o desactivar.", 90),
    ],
  },
  {
    id: "google",
    name: "Google",
    domain: "google.com",
    category: "Tecnología",
    trend: 1,
    scores: { privacidad: 50, seguridad: 82, transparencia: 62, minimizacion: 40, derechos: 80 },
    signatureAlgorithm: "ES256",
    incidents: [
      { year: 2019, text: "Multa de 50 M€ de la CNIL por falta de transparencia en el consentimiento." },
    ],
    policies: [
      policy("Identidad", "Nombre", "zkp", "Muestra tu perfil sin copiar el nombre a productos publicitarios.", 0),
      policy("Contacto", "Correo", "required", "Identificador de la cuenta Google.", 365),
      policy("Contacto", "Teléfono", "optional", "Recuperación y verificación en dos pasos.", 365),
      policy("Ubicación", "Ubicación", "required", "Maps, resultados locales y anuncios geolocalizados.", 540),
      policy("Comportamiento", "Historial de búsqueda", "optional", "Personaliza resultados y YouTube.", 540),
      policy("Contacto", "Contactos", "ignored", "Sugerencias de compartir. No se sincroniza por defecto.", 0),
    ],
  },
  {
    id: "uber",
    name: "Uber",
    domain: "uber.com",
    category: "Transporte",
    trend: 2,
    scores: { privacidad: 56, seguridad: 42, transparencia: 58, minimizacion: 50, derechos: 66 },
    signatureAlgorithm: "RS256",
    incidents: [
      { year: 2016, text: "Brecha que expuso datos de 57 millones de usuarios y conductores, ocultada por un año." },
      { year: 2022, text: "Intrusión en sistemas internos tras robo de credenciales de un contratista." },
    ],
    policies: [
      policy("Identidad", "Nombre", "required", "Identifica al pasajero ante el conductor.", 2555),
      policy("Contacto", "Teléfono", "required", "Coordina el viaje y envía el PIN de verificación.", 2555),
      policy("Ubicación", "Ubicación en tiempo real", "required", "Asigna el viaje y traza la ruta mientras está activo.", 2555),
      policy("Finanzas", "Pagos", "required", "Cobra el viaje y propinas.", 1825),
      policy("Comportamiento", "Historial de viajes", "optional", "Recibos, soporte y detección de fraude.", 730),
    ],
  },
  {
    id: "x",
    name: "X (Twitter)",
    domain: "x.com",
    category: "Redes sociales",
    trend: -4,
    scores: { privacidad: 46, seguridad: 40, transparencia: 44, minimizacion: 50, derechos: 58 },
    signatureAlgorithm: "RS256",
    incidents: [
      { year: 2022, text: "Filtración de datos de 5,4 millones de cuentas por una vulnerabilidad de la API." },
    ],
    policies: [
      policy("Contacto", "Correo", "required", "Crea la cuenta y recupera el acceso.", 365),
      policy("Contacto", "Teléfono", "optional", "Verifica la cuenta y sugiere contactos.", 365),
      policy("Ubicación", "Ubicación", "optional", "Tendencias locales y anuncios geolocalizados.", 365),
      policy("Contacto", "Contactos", "ignored", "Sugerencias de seguimiento si subes tu agenda.", 90),
      policy("Comportamiento", "Mensajes", "optional", "Almacena DMs para sincronizar dispositivos.", 365),
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    domain: "tiktok.com",
    category: "Redes sociales",
    trend: -2,
    scores: { privacidad: 36, seguridad: 52, transparencia: 38, minimizacion: 34, derechos: 56 },
    signatureAlgorithm: "RS256",
    incidents: [{ year: 2023, text: "Multa de 345 M€ en Irlanda por el manejo de datos de menores (GDPR)." }],
    policies: [
      policy("Identidad", "Fecha de nacimiento", "required", "Aplica el muro de edad y limita cuentas de menores.", 540),
      policy("Contacto", "Teléfono", "optional", "Recuperación de cuenta y sugerencias de amigos.", 540),
      policy("Ubicación", "Ubicación", "optional", "Feed local y anuncios por zona.", 540),
      policy("Contacto", "Contactos", "ignored", "Sugerencias si concedes acceso a la agenda.", 90),
      policy("Biometría", "Biometría facial y de voz", "required", "Efectos, moderación y detección de menores.", 540),
    ],
  },
  {
    id: "meta",
    name: "Meta (Facebook)",
    domain: "facebook.com",
    category: "Redes sociales",
    trend: -3,
    scores: { privacidad: 32, seguridad: 38, transparencia: 42, minimizacion: 30, derechos: 62 },
    signatureAlgorithm: "RS256",
    incidents: [
      { year: 2021, text: "Publicación de datos de 533 millones de usuarios obtenidos por scraping." },
      { year: 2023, text: "Multa récord de 1.200 M€ por transferir datos de europeos a EE. UU. (GDPR)." },
    ],
    policies: [
      policy("Identidad", "Nombre", "required", "Identidad pública del perfil y de las páginas.", 730),
      policy("Contacto", "Teléfono", "optional", "Recuperación, 2FA y sugerencias de amistad.", 730),
      policy("Ubicación", "Ubicación", "optional", "Anuncios locales y recuerdos geolocalizados.", 730),
      policy("Contacto", "Contactos", "ignored", "Sugerencias de amigos si subes la agenda.", 180),
      policy("Comportamiento", "Intereses", "optional", "Alimenta el feed y el sistema publicitario.", 730),
      policy("Comportamiento", "Actividad fuera de la app", "required", "Pixel y eventos de sitios asociados para anuncios.", 730),
    ],
  },
];

export function trustScore(scores) {
  return Math.round(
    DIMENSIONS.reduce((total, dimension) => total + scores[dimension.key] * dimension.weight, 0)
  );
}

export function gradeFor(score) {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
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

export const trustCompanies = companies.map((company) => {
  const score = trustScore(company.scores);
  return { ...company, score, grade: gradeFor(score) };
});

export function companyById(id) {
  return trustCompanies.find((company) => company.id === id);
}

export const lastScan = "2026-10-24 06:00";
export const sourcesCount = 1284;

// Contrato mock unificado con la app móvil. Jesús conectará el scraper después.
// Escala de grados: A | B | C | D. Company.policies: PolicyPoint[].

export const DIMENSIONS = [
  {
    key: "seguridad",
    label: "Seguridad",
    weight: 0.25,
    description: "Cifrado, control de acceso y protección de la cuenta.",
  },
  {
    key: "minimizacion",
    label: "Minimización y Propósito",
    weight: 0.2,
    description: "Si pide solo los datos que necesita para operar.",
  },
  {
    key: "transparencia",
    label: "Transparencia",
    weight: 0.2,
    description: "Si declara para qué usa cada dato y con quién lo comparte.",
  },
  {
    key: "derechos",
    label: "Derechos del usuario",
    weight: 0.15,
    description: "Facilidad para descargar, corregir o borrar tus datos.",
  },
  {
    key: "retencion",
    label: "Retención",
    weight: 0.1,
    description: "Si declara plazos claros de conservación y borrado.",
  },
  {
    key: "terceros",
    label: "Terceros",
    weight: 0.1,
    description: "Con quién comparte datos y bajo qué condiciones.",
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

function oracle(scores, justifications, scoreTotal, grade) {
  return { scores, justifications, scoreTotal, grade };
}

function logoUrlFor(domain) {
  const host = domain === "x.com" ? "twitter.com" : domain;
  return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
}

const companies = [
  {
    id: "apple",
    name: "Apple",
    domain: "apple.com",
    category: "Tecnología",
    trend: 2,
    ...oracle(
      { seguridad: 60, minimizacion: 50, transparencia: 40, derechos: 70, retencion: 30, terceros: 50 },
      {
        seguridad: "Menciona prácticas generales de almacenamiento, sin detalle de cifrado.",
        minimizacion: "No limita con claridad la recolección a lo estrictamente necesario.",
        transparencia: "La página pública redirige a enlaces y deja el extracto incompleto.",
        derechos: "Hay un enlace directo para gestionar y acceder a los datos de la cuenta.",
        retencion: "No declara plazos específicos de conservación ni borrado.",
        terceros: "No explica con claridad los criterios para compartir con terceros.",
      },
      52,
      "C"
    ),
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
    ...oracle(
      { seguridad: 85, minimizacion: 75, transparencia: 90, derechos: 90, retencion: 70, terceros: 75 },
      {
        seguridad: "Medidas técnicas estándar de la industria, descritas de forma general.",
        minimizacion: "Recopila datos de uso y técnicos justificados por el streaming.",
        transparencia: "Estructura clara, con secciones detalladas sobre el tratamiento.",
        derechos: "Acceso, rectificación, supresión y portabilidad bien declarados.",
        retencion: "Retención ligada a fraude y ley, sin plazos por categoría.",
        terceros: "Publicidad dirigida con socios y un opt-out visible.",
      },
      82,
      "B"
    ),
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
    ...oracle(
      { seguridad: 85, minimizacion: 75, transparencia: 90, derechos: 85, retencion: 70, terceros: 80 },
      {
        seguridad: "Medidas técnicas robustas y cifrado, con una superficie de datos muy amplia.",
        minimizacion: "Recoge voz, biometría y contenido; hay controles para limitar lo opcional.",
        transparencia: "Muy detallada: categorías de datos y finalidades quedan explícitas.",
        derechos: "Canales claros para acceder y controlar la información de la cuenta.",
        retencion: "Habla de almacenamiento general, sin plazos por categoría en el extracto.",
        terceros: "Describe filiales, proveedores y marcos de transferencia internacional.",
      },
      81,
      "B"
    ),
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
    ...oracle(
      { seguridad: 90, minimizacion: 75, transparencia: 85, derechos: 80, retencion: 70, terceros: 70 },
      {
        seguridad: "Autenticación, biometría y prevención de fraude bien descritos.",
        minimizacion: "Pide datos financieros, biometría y contactos; amplio para un medio de pago.",
        transparencia: "Categorías y fuentes quedan claras, con lenguaje legal denso.",
        derechos: "Declara derechos y controles de perfil sujetos a la ley aplicable.",
        retencion: "Falta una sección clara de plazos por categoría de dato.",
        terceros: "Comparte con socios, agencias de crédito y el grupo corporativo.",
      },
      80,
      "B"
    ),
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
    ...oracle(
      { seguridad: 85, minimizacion: 75, transparencia: 95, derechos: 90, retencion: 80, terceros: 75 },
      {
        seguridad: "Medidas técnicas y organizativas robustas para fraude y sistemas.",
        minimizacion: "Recoge pago, uso y dispositivo; volumen alto pero alineado al servicio.",
        transparencia: "Muy estructurada: categorías, fuentes y usos quedan explícitos.",
        derechos: "Detalla derechos, privacidad y apelaciones con mecanismos concretos.",
        retencion: "Retiene por fines comerciales y legales; los plazos exactos son menos claros.",
        terceros: "Comparte con socios, proveedores y publicidad conductual.",
      },
      83,
      "B"
    ),
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
    ...oracle(
      { seguridad: 70, minimizacion: 60, transparencia: 65, derechos: 70, retencion: 50, terceros: 60 },
      {
        seguridad: "Cifrado estándar en tránsito y reposo, sin detalle de auditoría.",
        minimizacion: "Pide más datos de los estrictamente necesarios para reservar.",
        transparencia: "Lenguaje comprensible, denso en cookies y usos secundarios.",
        derechos: "Declara ARCO, con tiempos de respuesta amplios.",
        retencion: "Los plazos de conservación son vagos y dependen de criterios internos.",
        terceros: "Comparte con socios y proveedores, con poco opt-out.",
      },
      64,
      "C"
    ),
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
    ...oracle(
      { seguridad: 85, minimizacion: 75, transparencia: 80, derechos: 85, retencion: 70, terceros: 75 },
      {
        seguridad: "Medidas adecuadas y biometría para autenticar y prevenir fraude.",
        minimizacion: "Pide lo necesario para operar, con varios datos obligatorios.",
        transparencia: "Explica cookies, recomendaciones y biometría con centro de privacidad.",
        derechos: "Canales claros para acceder, corregir y pedir reportes.",
        retencion: "Guarda el mínimo para el propósito o por requerimiento legal.",
        terceros: "No vende datos, pero unifica la cuenta con Mercado Pago.",
      },
      79,
      "B"
    ),
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
    ...oracle(
      { seguridad: 70, minimizacion: 48, transparencia: 58, derechos: 70, retencion: 45, terceros: 40 },
      {
        seguridad: "Protege pagos y cuentas, con una superficie publicitaria enorme.",
        minimizacion: "Cruza compras, Alexa y habitación para personalizar y vender.",
        transparencia: "La política es larga y opaca sobre publicidad basada en datos.",
        derechos: "Permite descargar y borrar, con flujos poco visibles.",
        retencion: "Guardan historial de compras y voz por años, sin plazo claro.",
        terceros: "Comparten perfiles con vendedores, anunciantes y filiales.",
      },
      58,
      "C"
    ),
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
    ...oracle(
      { seguridad: 90, minimizacion: 70, transparencia: 85, derechos: 80, retencion: 75, terceros: 70 },
      {
        seguridad: "Cifrado, 2FA y controles internos; centraliza un volumen enorme de datos.",
        minimizacion: "Recoge actividad, ubicación y dispositivos más allá de lo esencial.",
        transparencia: "Documento detallado, con definiciones y ejemplos claros.",
        derechos: "Exportar y borrar es posible; los flujos de gestión son complejos.",
        retencion: "El plazo depende de la cuenta y el dispositivo, sin un tope global.",
        terceros: "Socios de confianza y un intercambio amplio para anuncios.",
      },
      79,
      "B"
    ),
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
    ...oracle(
      { seguridad: 90, minimizacion: 85, transparencia: 95, derechos: 90, retencion: 80, terceros: 85 },
      {
        seguridad: "Verificación biométrica y cifrado, con una recolección amplia de superficie.",
        minimizacion: "Ubicación y demografía justificadas por el servicio de viaje.",
        transparencia: "Detalle geográfico y legal adaptado a GDPR, LGPD y otras normas.",
        derechos: "Mecanismos locales e internacionales para ARCO y portabilidad.",
        retencion: "La retención se fragmenta en apartados externos a consultar.",
        terceros: "Declara intercambios con usuarios, conductores y socios.",
      },
      89,
      "B"
    ),
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
    ...oracle(
      { seguridad: 75, minimizacion: 60, transparencia: 80, derechos: 70, retencion: 50, terceros: 65 },
      {
        seguridad: "Autenticación y cifrado de DMs; recoge biometría y mucho del dispositivo.",
        minimizacion: "Pide contactos, agenda y metadatos que exceden el timeline.",
        transparencia: "Explica qué se recoge, con muchos propósitos superpuestos.",
        derechos: "Hay controles; el entrenamiento de IA y el rastreo son difíciles de limitar.",
        retencion: "La retención es genérica, sin plazos por categoría.",
        terceros: "Amplio intercambio con anunciantes, afiliados y socios.",
      },
      69,
      "C"
    ),
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
    logoUrl: "",
    ...oracle(
      { seguridad: 75, minimizacion: 60, transparencia: 80, derechos: 70, retencion: 50, terceros: 45 },
      {
        seguridad: "Menciona cifrado, pero recolecta un volumen enorme de datos sensibles.",
        minimizacion: "Biometría, teclas y portapapeles: pide mucho más de lo necesario.",
        transparencia: "Detalla qué recoge; el volumen abruma al usuario promedio.",
        derechos: "Hay ajustes, con control limitado en varias jurisdicciones.",
        retencion: "No fija plazos exactos por categoría de dato.",
        terceros: "Comparte con anunciantes, socios y afiliados de forma amplia.",
      },
      68,
      "C"
    ),
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
    ...oracle(
      { seguridad: 38, minimizacion: 30, transparencia: 42, derechos: 62, retencion: 40, terceros: 28 },
      {
        seguridad: "Historial de filtraciones masivas; la cuenta concentra demasiada superficie.",
        minimizacion: "Pixel, intereses y actividad fuera de la app: pide casi todo.",
        transparencia: "El texto es largo, pero el sistema publicitario sigue opaco.",
        derechos: "Descargar y borrar existe; desconectar el anuncio es difícil.",
        retencion: "Guardan tus datos años sin un plazo único y claro.",
        terceros: "Comparten perfiles con anunciantes, apps y filiales del grupo.",
      },
      40,
      "D"
    ),
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
  if (score >= 90) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
}

export const LEVELS = [
  { min: 90, grade: "A", label: "Confiable", tone: "good", icon: "✓" },
  { min: 70, grade: "B", label: "Aceptable", tone: "warning", icon: "!" },
  { min: 50, grade: "C", label: "Riesgo moderado", tone: "serious", icon: "▲" },
  { min: 0, grade: "D", label: "Alto riesgo", tone: "critical", icon: "✕" },
];

export function levelFor(score) {
  return LEVELS.find((level) => score >= level.min);
}

export const trustCompanies = companies.map((company) => ({
  ...company,
  logoUrl: company.logoUrl !== undefined ? company.logoUrl : logoUrlFor(company.domain),
  score: company.scoreTotal,
}));

export function companyById(id) {
  return trustCompanies.find((company) => company.id === id);
}

export const lastScan = "2026-10-24 06:00";
export const sourcesCount = 1284;

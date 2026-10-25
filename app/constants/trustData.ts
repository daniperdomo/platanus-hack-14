// Contrato canónico del Trust Dashboard. frontend/src/lib/trustData.js es su espejo
// en la web: cualquier cambio de forma o de datos debe hacerse en ambos archivos.
// Los puntajes y políticas son ilustrativos hasta conectar el scraper; los
// incidentes listados son hechos públicos conocidos.

export type Grade = 'A' | 'B' | 'C' | 'D';

export type PolicyCategory = 'identity' | 'location' | 'device' | 'payments' | 'biometrics' | 'telemetry';

export type PolicyStatus = 'required' | 'optional' | 'zkp' | 'ignored';

export type PolicyPoint = {
  id: string;
  category: PolicyCategory;
  label: string;
  status: PolicyStatus;
  reason: string;
  retentionDays: number;
  sharedWith: string[];
};

export type DimensionKey = 'privacidad' | 'seguridad' | 'transparencia' | 'minimizacion' | 'derechos';

export type Incident = { year: number; text: string };

export type Company = {
  id: string;
  name: string;
  domain: string;
  category: string;
  score: number;
  grade: Grade;
  trend: number;
  incidents: Incident[];
  dimensions: Record<DimensionKey, number>;
  crypto: { algorithm: string; ephemeralProcessing: boolean };
  policies: PolicyPoint[];
};

export const DIMENSIONS: { key: DimensionKey; label: string; weight: number; description: string }[] = [
  {
    key: 'privacidad',
    label: 'Privacidad',
    weight: 0.25,
    description: 'Qué tan clara y respetuosa es su política de privacidad.',
  },
  {
    key: 'seguridad',
    label: 'Seguridad',
    weight: 0.25,
    description: 'Historial de brechas y filtraciones de datos.',
  },
  {
    key: 'transparencia',
    label: 'Transparencia',
    weight: 0.2,
    description: 'Si declara para qué usa cada dato y con quién lo comparte.',
  },
  {
    key: 'minimizacion',
    label: 'Minimización',
    weight: 0.15,
    description: 'Si pide solo los datos que necesita para operar.',
  },
  {
    key: 'derechos',
    label: 'Derechos del usuario',
    weight: 0.15,
    description: 'Facilidad para descargar, corregir o borrar tus datos.',
  },
];

export const POLICY_STATUS_LABEL: Record<PolicyStatus, string> = {
  required: 'Requerido',
  optional: 'Opcional',
  zkp: 'Prueba ZK',
  ignored: 'No se entrega',
};

export const POLICY_CATEGORY_LABEL: Record<PolicyCategory, string> = {
  identity: 'Identidad',
  location: 'Ubicación',
  device: 'Dispositivo',
  payments: 'Pagos',
  biometrics: 'Biometría',
  telemetry: 'Telemetría',
};

export function trustScore(dimensions: Record<DimensionKey, number>) {
  return Math.round(DIMENSIONS.reduce((total, d) => total + dimensions[d.key] * d.weight, 0));
}

export function gradeFor(score: number): Grade {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

export function formatRetention(days: number) {
  if (days === 0) return 'No se guarda';
  if (days === 1) return '1 día';
  if (days % 365 === 0) {
    const years = days / 365;
    return years === 1 ? '1 año' : `${years} años`;
  }
  return `${days} días`;
}

function policy(
  category: PolicyCategory,
  label: string,
  status: PolicyStatus,
  reason: string,
  retentionDays: number,
  sharedWith: string[] = []
): PolicyPoint {
  const slug = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');
  return { id: `${category}-${slug}`, category, label, status, reason, retentionDays, sharedWith };
}

const ZEROID_CRYPTO = { algorithm: 'RS256', ephemeralProcessing: true };
const LEGACY_CRYPTO = { algorithm: 'RS256', ephemeralProcessing: false };

type CompanySeed = Omit<Company, 'score' | 'grade'>;

const SEEDS: CompanySeed[] = [
  {
    id: 'expreso-caribe',
    name: 'Expreso Caribe',
    domain: 'expresocaribe.com',
    category: 'Transporte',
    trend: 4,
    incidents: [],
    dimensions: { privacidad: 84, seguridad: 80, transparencia: 86, minimizacion: 88, derechos: 78 },
    crypto: ZEROID_CRYPTO,
    policies: [
      policy('identity', 'Nombre completo', 'required', 'Emitir el boleto a tu nombre, como exige la ley de transporte terrestre.', 365, ['Operador del bus']),
      policy('identity', 'Número de documento', 'required', 'Verificar tu identidad al abordar el autobús.', 365, ['Operador del bus']),
      policy('identity', 'Correo electrónico', 'required', 'Enviarte el boleto y el comprobante de pago.', 730),
      policy('identity', 'Teléfono', 'optional', 'Avisarte por SMS de retrasos o cambios de andén.', 730, ['Proveedor de SMS']),
      policy('identity', 'Fecha de nacimiento', 'optional', 'Aplicar descuentos de estudiante o tercera edad; no se guarda.', 0),
      policy('location', 'Dirección', 'optional', 'Emitir factura fiscal a tu nombre.', 1825, ['Servicio de impuestos']),
      policy('biometrics', 'Selfie', 'ignored', 'La verificación facial la hace ZeroID; la empresa nunca recibe tu rostro.', 0),
    ],
  },
  {
    id: 'yummy',
    name: 'Yummy',
    domain: 'yummy.cl',
    category: 'Delivery',
    trend: 1,
    incidents: [],
    dimensions: { privacidad: 78, seguridad: 74, transparencia: 80, minimizacion: 70, derechos: 72 },
    crypto: ZEROID_CRYPTO,
    policies: [
      policy('identity', 'Persona real y única', 'zkp', 'Evitar cuentas falsas sin conocer quién eres.', 0),
      policy('identity', 'Nombre', 'required', 'Que el repartidor sepa a quién entregar el pedido.', 30, ['Repartidores']),
      policy('location', 'Dirección de entrega', 'required', 'Llevar el pedido a tu puerta.', 30, ['Repartidores']),
      policy('location', 'Ubicación en tiempo real', 'optional', 'Afinar el punto de entrega mientras llega el pedido.', 1),
      policy('payments', 'Medio de pago', 'required', 'Cobrar el pedido y emitir la boleta.', 1825, ['Procesador de pagos']),
      policy('telemetry', 'Historial de pedidos', 'optional', 'Recomendarte restaurantes.', 365),
      policy('device', 'Datos del dispositivo', 'ignored', 'No son necesarios para operar; ZeroID no los entrega.', 0),
    ],
  },
  {
    id: 'apple',
    name: 'Apple',
    domain: 'apple.com',
    category: 'Tecnología',
    trend: 2,
    incidents: [],
    dimensions: { privacidad: 90, seguridad: 85, transparencia: 84, minimizacion: 82, derechos: 88 },
    crypto: LEGACY_CRYPTO,
    policies: [
      policy('identity', 'Nombre y correo', 'required', 'Crear y recuperar tu Apple ID.', 1095),
      policy('payments', 'Pagos', 'required', 'Compras en App Store y suscripciones.', 1825, ['Procesador de pagos']),
      policy('location', 'Ubicación aproximada', 'optional', 'Servicios locales y Buscar.', 90),
      policy('device', 'Uso de dispositivos', 'optional', 'Diagnóstico anónimo, solo si lo activas.', 90),
    ],
  },
  {
    id: 'spotify',
    name: 'Spotify',
    domain: 'spotify.com',
    category: 'Entretenimiento',
    trend: 0,
    incidents: [],
    dimensions: { privacidad: 74, seguridad: 80, transparencia: 76, minimizacion: 70, derechos: 82 },
    crypto: LEGACY_CRYPTO,
    policies: [
      policy('identity', 'Correo', 'required', 'Iniciar sesión y facturar.', 1095),
      policy('identity', 'Fecha de nacimiento', 'required', 'Restringir contenido por edad.', 1095),
      policy('telemetry', 'Historial de escucha', 'required', 'Recomendaciones y publicidad dirigida.', 1095, ['Anunciantes']),
      policy('payments', 'Pagos', 'optional', 'Solo en planes Premium.', 1825, ['Procesador de pagos']),
    ],
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    domain: 'microsoft.com',
    category: 'Tecnología',
    trend: -1,
    incidents: [],
    dimensions: { privacidad: 76, seguridad: 70, transparencia: 78, minimizacion: 68, derechos: 84 },
    crypto: LEGACY_CRYPTO,
    policies: [
      policy('identity', 'Nombre y correo', 'required', 'Crear tu cuenta Microsoft.', 1095),
      policy('identity', 'Teléfono', 'optional', 'Verificación en dos pasos.', 1095),
      policy('telemetry', 'Telemetría', 'required', 'Diagnóstico de Windows; el nivel básico no se puede apagar.', 540),
      policy('payments', 'Pagos', 'optional', 'Suscripciones y compras.', 1825, ['Procesador de pagos']),
    ],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    domain: 'paypal.com',
    category: 'Finanzas',
    trend: 1,
    incidents: [],
    dimensions: { privacidad: 72, seguridad: 74, transparencia: 70, minimizacion: 62, derechos: 76 },
    crypto: LEGACY_CRYPTO,
    policies: [
      policy('identity', 'Documento', 'required', 'Verificación KYC exigida por regulación financiera.', 1825, ['Reguladores']),
      policy('location', 'Dirección', 'required', 'Verificación KYC y prevención de fraude.', 1825),
      policy('payments', 'Cuentas bancarias', 'required', 'Mover dinero entre cuentas.', 1825, ['Bancos']),
      policy('payments', 'Historial de pagos', 'required', 'Prevención de fraude.', 1825, ['Socios antifraude']),
    ],
  },
  {
    id: 'netflix',
    name: 'Netflix',
    domain: 'netflix.com',
    category: 'Entretenimiento',
    trend: 0,
    incidents: [],
    dimensions: { privacidad: 70, seguridad: 78, transparencia: 68, minimizacion: 66, derechos: 74 },
    crypto: LEGACY_CRYPTO,
    policies: [
      policy('identity', 'Correo', 'required', 'Iniciar sesión.', 365),
      policy('payments', 'Pagos', 'required', 'Cobrar la suscripción.', 1825, ['Procesador de pagos']),
      policy('telemetry', 'Historial de visualización', 'required', 'Recomendaciones.', 365),
      policy('device', 'Dispositivos', 'required', 'Controlar cuántas pantallas usas.', 365),
    ],
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    domain: 'airbnb.com',
    category: 'Transporte',
    trend: 3,
    incidents: [],
    dimensions: { privacidad: 66, seguridad: 72, transparencia: 70, minimizacion: 54, derechos: 72 },
    crypto: LEGACY_CRYPTO,
    policies: [
      policy('identity', 'Documento', 'required', 'Verificar identidad de huéspedes y anfitriones.', 730, ['Proveedor de verificación']),
      policy('biometrics', 'Selfie', 'required', 'Comparar tu rostro con el documento.', 730, ['Proveedor de verificación']),
      policy('payments', 'Pagos', 'required', 'Cobrar reservas.', 1825, ['Procesador de pagos']),
      policy('location', 'Ubicación', 'optional', 'Sugerir alojamientos cercanos.', 365),
    ],
  },
  {
    id: 'mercadolibre',
    name: 'Mercado Libre',
    domain: 'mercadolibre.com',
    category: 'Comercio',
    trend: -2,
    incidents: [{ year: 2022, text: 'Acceso no autorizado a datos de unos 300.000 usuarios.' }],
    dimensions: { privacidad: 64, seguridad: 60, transparencia: 66, minimizacion: 58, derechos: 68 },
    crypto: LEGACY_CRYPTO,
    policies: [
      policy('identity', 'Documento', 'required', 'Validar compradores y vendedores.', 1095),
      policy('location', 'Dirección', 'required', 'Envíos.', 1095, ['Empresas de envío']),
      policy('payments', 'Pagos', 'required', 'Cobrar compras con Mercado Pago.', 1825),
      policy('telemetry', 'Historial de compras', 'required', 'Recomendaciones y publicidad.', 1095, ['Anunciantes']),
    ],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    domain: 'amazon.com',
    category: 'Comercio',
    trend: -1,
    incidents: [{ year: 2021, text: 'Multa de 746 M€ en Luxemburgo por publicidad basada en datos personales (GDPR).' }],
    dimensions: { privacidad: 54, seguridad: 70, transparencia: 58, minimizacion: 48, derechos: 70 },
    crypto: LEGACY_CRYPTO,
    policies: [
      policy('location', 'Dirección', 'required', 'Envíos.', 1095, ['Transportistas']),
      policy('payments', 'Pagos', 'required', 'Cobrar compras.', 1825, ['Procesador de pagos']),
      policy('telemetry', 'Historial de compras', 'required', 'Recomendaciones y publicidad.', 1095, ['Anunciantes']),
      policy('biometrics', 'Grabaciones de voz', 'optional', 'Mejorar Alexa; se guardan hasta que las borres.', 1095),
    ],
  },
  {
    id: 'google',
    name: 'Google',
    domain: 'google.com',
    category: 'Tecnología',
    trend: 1,
    incidents: [{ year: 2019, text: 'Multa de 50 M€ de la CNIL por falta de transparencia en el consentimiento.' }],
    dimensions: { privacidad: 50, seguridad: 82, transparencia: 62, minimizacion: 40, derechos: 80 },
    crypto: LEGACY_CRYPTO,
    policies: [
      policy('identity', 'Nombre y teléfono', 'required', 'Crear y recuperar tu cuenta.', 540),
      policy('location', 'Ubicación', 'optional', 'Mapas y anuncios locales.', 540, ['Anunciantes']),
      policy('telemetry', 'Historial de búsqueda', 'required', 'Personalizar resultados y anuncios.', 540, ['Anunciantes']),
      policy('device', 'Contactos', 'optional', 'Sincronizar tu agenda.', 540),
    ],
  },
  {
    id: 'uber',
    name: 'Uber',
    domain: 'uber.com',
    category: 'Transporte',
    trend: 2,
    incidents: [
      { year: 2016, text: 'Brecha que expuso datos de 57 millones de usuarios y conductores, ocultada por un año.' },
      { year: 2022, text: 'Intrusión en sistemas internos tras robo de credenciales de un contratista.' },
    ],
    dimensions: { privacidad: 56, seguridad: 42, transparencia: 58, minimizacion: 50, derechos: 66 },
    crypto: LEGACY_CRYPTO,
    policies: [
      policy('identity', 'Nombre y teléfono', 'required', 'Coordinar el viaje con el conductor.', 2555, ['Conductores']),
      policy('location', 'Ubicación en tiempo real', 'required', 'Recogerte y calcular la tarifa.', 2555, ['Conductores']),
      policy('payments', 'Pagos', 'required', 'Cobrar el viaje.', 2555, ['Procesador de pagos']),
      policy('telemetry', 'Historial de viajes', 'required', 'Seguridad y soporte.', 2555),
    ],
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    domain: 'x.com',
    category: 'Redes sociales',
    trend: -4,
    incidents: [{ year: 2022, text: 'Filtración de datos de 5,4 millones de cuentas por una vulnerabilidad de la API.' }],
    dimensions: { privacidad: 46, seguridad: 40, transparencia: 44, minimizacion: 50, derechos: 58 },
    crypto: LEGACY_CRYPTO,
    policies: [
      policy('identity', 'Correo y teléfono', 'required', 'Crear la cuenta y verificarla.', 365),
      policy('location', 'Ubicación', 'optional', 'Tendencias locales y anuncios.', 365, ['Anunciantes']),
      policy('device', 'Contactos', 'optional', 'Sugerir a quién seguir.', 365),
      policy('telemetry', 'Mensajes', 'required', 'Moderación y entrenamiento de modelos.', 365),
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    domain: 'tiktok.com',
    category: 'Redes sociales',
    trend: -2,
    incidents: [{ year: 2023, text: 'Multa de 345 M€ en Irlanda por el manejo de datos de menores (GDPR).' }],
    dimensions: { privacidad: 36, seguridad: 52, transparencia: 38, minimizacion: 34, derechos: 56 },
    crypto: LEGACY_CRYPTO,
    policies: [
      policy('identity', 'Fecha de nacimiento', 'required', 'Restringir funciones a menores.', 540),
      policy('location', 'Ubicación', 'required', 'Contenido y anuncios por región.', 540, ['Anunciantes']),
      policy('device', 'Contactos', 'optional', 'Encontrar amigos.', 540),
      policy('biometrics', 'Biometría facial y de voz', 'required', 'Efectos, subtítulos y moderación.', 540),
    ],
  },
  {
    id: 'meta',
    name: 'Meta (Facebook)',
    domain: 'facebook.com',
    category: 'Redes sociales',
    trend: -3,
    incidents: [
      { year: 2021, text: 'Publicación de datos de 533 millones de usuarios obtenidos por scraping.' },
      { year: 2023, text: 'Multa récord de 1.200 M€ por transferir datos de europeos a EE. UU. (GDPR).' },
    ],
    dimensions: { privacidad: 32, seguridad: 38, transparencia: 42, minimizacion: 30, derechos: 62 },
    crypto: LEGACY_CRYPTO,
    policies: [
      policy('identity', 'Nombre y teléfono', 'required', 'Crear el perfil.', 730),
      policy('location', 'Ubicación', 'required', 'Anuncios y sugerencias locales.', 730, ['Anunciantes']),
      policy('device', 'Contactos', 'optional', 'Sugerir amigos.', 730),
      policy('telemetry', 'Actividad fuera de la app', 'required', 'Medir anuncios mediante el píxel de Meta.', 730, ['Anunciantes', 'Socios de medición']),
    ],
  },
];

export const TRUST_COMPANIES: Company[] = SEEDS.map((seed) => {
  const score = trustScore(seed.dimensions);
  return { ...seed, score, grade: gradeFor(score) };
});

export function companyForDomain(domain: string | null | undefined) {
  if (!domain) return undefined;
  const host = domain.toLowerCase().replace(/^www\./, '');
  return TRUST_COMPANIES.find((company) => company.domain === host);
}

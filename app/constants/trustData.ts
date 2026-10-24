import type { FeatherIconName, TrustScore } from '../components/PrivacyDossier';

export type TrustCompany = {
  id: string;
  name: string;
  domain: string;
  category: string;
  score: number;
  trend: number;
  collects: string[];
  incidents: { year: number; text: string }[];
  retentionDays: number;
};

export const TRUST_COMPANIES: TrustCompany[] = [
  {
    id: 'apple',
    name: 'Apple',
    domain: 'apple.com',
    category: 'Tecnología',
    score: 86,
    trend: 2,
    collects: ['Nombre', 'Correo', 'Pagos', 'Ubicación aproximada'],
    incidents: [],
    retentionDays: 0,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    domain: 'spotify.com',
    category: 'Entretenimiento',
    score: 76,
    trend: 0,
    collects: ['Correo', 'Fecha de nacimiento', 'Historial de escucha'],
    incidents: [],
    retentionDays: 90,
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    domain: 'microsoft.com',
    category: 'Tecnología',
    score: 75,
    trend: -1,
    collects: ['Nombre', 'Correo', 'Teléfono', 'Telemetría'],
    incidents: [],
    retentionDays: 180,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    domain: 'paypal.com',
    category: 'Finanzas',
    score: 71,
    trend: 1,
    collects: ['Nombre', 'Documento', 'Dirección', 'Cuentas bancarias'],
    incidents: [],
    retentionDays: 1825,
  },
  {
    id: 'netflix',
    name: 'Netflix',
    domain: 'netflix.com',
    category: 'Entretenimiento',
    score: 71,
    trend: 0,
    collects: ['Correo', 'Pagos', 'Historial de visualización'],
    incidents: [],
    retentionDays: 365,
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    domain: 'airbnb.com',
    category: 'Transporte',
    score: 67,
    trend: 3,
    collects: ['Nombre', 'Documento', 'Selfie', 'Ubicación'],
    incidents: [],
    retentionDays: 730,
  },
  {
    id: 'mercadolibre',
    name: 'Mercado Libre',
    domain: 'mercadolibre.com',
    category: 'Comercio',
    score: 63,
    trend: -2,
    collects: ['Nombre', 'Documento', 'Dirección', 'Pagos'],
    incidents: [{ year: 2022, text: 'Acceso no autorizado a datos de unos 300.000 usuarios.' }],
    retentionDays: 1095,
  },
  {
    id: 'amazon',
    name: 'Amazon',
    domain: 'amazon.com',
    category: 'Comercio',
    score: 59,
    trend: -1,
    collects: ['Nombre', 'Dirección', 'Pagos', 'Grabaciones de voz'],
    incidents: [{ year: 2021, text: 'Multa de 746 M€ en Luxemburgo por publicidad basada en datos personales.' }],
    retentionDays: 1095,
  },
  {
    id: 'google',
    name: 'Google',
    domain: 'google.com',
    category: 'Tecnología',
    score: 61,
    trend: 1,
    collects: ['Nombre', 'Correo', 'Ubicación', 'Historial de búsqueda'],
    incidents: [{ year: 2019, text: 'Multa de 50 M€ de la CNIL por falta de transparencia en el consentimiento.' }],
    retentionDays: 540,
  },
  {
    id: 'uber',
    name: 'Uber',
    domain: 'uber.com',
    category: 'Transporte',
    score: 54,
    trend: 2,
    collects: ['Nombre', 'Teléfono', 'Ubicación en tiempo real', 'Pagos'],
    incidents: [
      { year: 2016, text: 'Brecha que expuso datos de 57 millones de usuarios y conductores.' },
    ],
    retentionDays: 2555,
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    domain: 'x.com',
    category: 'Redes sociales',
    score: 47,
    trend: -4,
    collects: ['Correo', 'Teléfono', 'Ubicación', 'Contactos'],
    incidents: [{ year: 2022, text: 'Filtración de datos de 5,4 millones de cuentas.' }],
    retentionDays: 365,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    domain: 'tiktok.com',
    category: 'Redes sociales',
    score: 42,
    trend: -2,
    collects: ['Fecha de nacimiento', 'Teléfono', 'Biometría facial y de voz'],
    incidents: [{ year: 2023, text: 'Multa de 345 M€ en Irlanda por el manejo de datos de menores.' }],
    retentionDays: 540,
  },
  {
    id: 'meta',
    name: 'Meta (Facebook)',
    domain: 'facebook.com',
    category: 'Redes sociales',
    score: 39,
    trend: -3,
    collects: ['Nombre', 'Teléfono', 'Ubicación', 'Actividad fuera de la app'],
    incidents: [
      { year: 2023, text: 'Multa récord de 1.200 M€ por transferir datos de europeos a EE. UU.' },
    ],
    retentionDays: 730,
  },
];

export function gradeFor(score: number): TrustScore {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  return 'F';
}

const ICON_FOR: Record<string, FeatherIconName> = {
  Nombre: 'user',
  Correo: 'mail',
  Teléfono: 'phone',
  Documento: 'credit-card',
  Dirección: 'home',
  Pagos: 'credit-card',
  Ubicación: 'map-pin',
  'Ubicación aproximada': 'map-pin',
  'Ubicación en tiempo real': 'map-pin',
  Selfie: 'camera',
  Contactos: 'users',
  Telemetría: 'activity',
  'Fecha de nacimiento': 'calendar',
  'Historial de escucha': 'music',
  'Historial de visualización': 'film',
  'Historial de búsqueda': 'search',
  'Grabaciones de voz': 'mic',
  'Biometría facial y de voz': 'eye',
  'Cuentas bancarias': 'dollar-sign',
  'Actividad fuera de la app': 'globe',
};

export function dataPointsFor(collects: string[]) {
  return collects.map((label, index) => {
    const lower = label.toLowerCase();
    const required = lower.includes('ubicaci') || lower.includes('biometr') || lower.includes('documento');
    return {
      id: `${label}-${index}`,
      label,
      icon: ICON_FOR[label] ?? 'circle',
      status: required ? ('required' as const) : index === 0 ? ('zkp' as const) : ('ignored' as const),
    };
  });
}

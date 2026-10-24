export const DATA_FIELDS: Record<string, string> = {
  nombre: 'Nombre completo',
  email: 'Correo electrónico',
  telefono: 'Teléfono',
  fecha_nacimiento: 'Fecha de nacimiento',
  mayor_de_edad: 'Mayor de edad',
  nacionalidad: 'Nacionalidad',
  documento: 'Número de documento',
  direccion: 'Dirección',
  persona_real_unica: 'Persona real y única',
};

export type ConnectionStatus = 'activa' | 'revocada';

export type VaultConnection = {
  id: string;
  name: string;
  domain: string;
  status: ConnectionStatus;
  connectedAt: string;
  lastAccess: string;
  fields: string[];
  purpose: string;
  retention: string;
};

export const VAULT_CONNECTIONS: VaultConnection[] = [
  {
    id: 'vercel',
    name: 'Vercel',
    domain: 'vercel.com',
    status: 'activa',
    connectedAt: '2026-10-21',
    lastAccess: '2026-10-24 09:12',
    fields: ['nombre', 'email', 'persona_real_unica'],
    purpose: 'Crear tu cuenta y evitar registros automatizados.',
    retention: 'Mientras tu cuenta esté activa.',
  },
  {
    id: 'bancoplus',
    name: 'BancoPlus',
    domain: 'bancoplus.com',
    status: 'activa',
    connectedAt: '2026-10-22',
    lastAccess: '2026-10-23 18:40',
    fields: ['nombre', 'documento', 'fecha_nacimiento', 'direccion'],
    purpose: 'Verificación KYC exigida por regulación financiera.',
    retention: '5 años, por obligación legal.',
  },
  {
    id: 'cinemax',
    name: 'Cinemax Online',
    domain: 'cinemax.tv',
    status: 'activa',
    connectedAt: '2026-10-23',
    lastAccess: '2026-10-24 21:05',
    fields: ['mayor_de_edad'],
    purpose: 'Habilitar contenido para mayores de 18 años.',
    retention: 'No guarda datos, solo la respuesta sí / no.',
  },
  {
    id: 'foromax',
    name: 'ForoMax',
    domain: 'foromax.net',
    status: 'revocada',
    connectedAt: '2026-10-20',
    lastAccess: '2026-10-21 11:30',
    fields: ['email', 'persona_real_unica'],
    purpose: 'Moderación: una cuenta por persona.',
    retention: 'Eliminado tras revocar el acceso.',
  },
];

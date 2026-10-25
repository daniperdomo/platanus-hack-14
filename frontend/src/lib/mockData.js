// Datos de demostración mientras el backend no expone la bóveda cifrada.

export const profile = {
  name: "Daniel Perdomo",
  zeroId: "zid_7f3a9c21",
  verifiedAt: "2026-10-20",
};

export const DATA_FIELDS = {
  nombre: "Nombre completo",
  email: "Correo electrónico",
  telefono: "Teléfono",
  fecha_nacimiento: "Fecha de nacimiento",
  mayor_de_edad: "Mayor de edad (sí / no)",
  nacionalidad: "Nacionalidad",
  documento: "Número de documento",
  direccion: "Dirección",
  persona_real_unica: "Persona real y única",
  ubicacion: "Ubicación",
};

export const storedData = [
  { field: "nombre", value: "Daniel Perdomo" },
  { field: "email", value: "daniel@correo.com" },
  { field: "telefono", value: "+58 412 •••• 321" },
  { field: "fecha_nacimiento", value: "•• / •• / 1999" },
  { field: "nacionalidad", value: "Venezuela" },
  { field: "documento", value: "•••• 4821" },
  { field: "direccion", value: "Caracas, Venezuela" },
];

export const connections = [
  {
    id: "vercel",
    name: "Vercel",
    domain: "vercel.com",
    status: "activa",
    connectedAt: "2026-10-21",
    lastAccess: "2026-10-24 09:12",
    fields: ["nombre", "email", "persona_real_unica"],
    purpose: "Crear tu cuenta y evitar registros automatizados.",
    retention: "Mientras tu cuenta esté activa.",
  },
  {
    id: "bancoplus",
    name: "BancoPlus",
    domain: "bancoplus.com",
    status: "activa",
    connectedAt: "2026-10-22",
    lastAccess: "2026-10-23 18:40",
    fields: ["nombre", "documento", "fecha_nacimiento", "direccion"],
    purpose: "Verificación KYC exigida por regulación financiera.",
    retention: "5 años, por obligación legal.",
  },
  {
    id: "cinemax",
    name: "Cinemax Online",
    domain: "cinemax.tv",
    status: "activa",
    connectedAt: "2026-10-23",
    lastAccess: "2026-10-24 21:05",
    fields: ["mayor_de_edad"],
    purpose: "Habilitar contenido para mayores de 18 años.",
    retention: "No guarda datos, solo la respuesta sí / no.",
  },
  {
    id: "foromax",
    name: "ForoMax",
    domain: "foromax.net",
    status: "revocada",
    connectedAt: "2026-10-20",
    lastAccess: "2026-10-21 11:30",
    fields: ["email", "persona_real_unica"],
    purpose: "Moderación: una cuenta por persona.",
    retention: "Eliminado tras revocar el acceso.",
  },
];

export const activity = [
  {
    id: 1,
    date: "2026-10-24 21:05",
    site: "Cinemax Online",
    type: "Inicio de sesión aprobado",
    fields: ["mayor_de_edad"],
  },
  {
    id: 2,
    date: "2026-10-24 09:12",
    site: "Vercel",
    type: "Inicio de sesión aprobado",
    fields: ["nombre", "email"],
  },
  {
    id: 3,
    date: "2026-10-23 22:47",
    site: "Desconocido (shop-ofertas.xyz)",
    type: "Solicitud rechazada",
    fields: ["documento", "direccion"],
  },
  {
    id: 4,
    date: "2026-10-23 18:40",
    site: "BancoPlus",
    type: "Inicio de sesión aprobado",
    fields: ["nombre", "documento"],
  },
  {
    id: 5,
    date: "2026-10-23 10:02",
    site: "Cinemax Online",
    type: "Nueva conexión autorizada",
    fields: ["mayor_de_edad"],
  },
  {
    id: 6,
    date: "2026-10-22 16:15",
    site: "BancoPlus",
    type: "Nueva conexión autorizada",
    fields: ["nombre", "documento", "fecha_nacimiento", "direccion"],
  },
  {
    id: 7,
    date: "2026-10-21 11:30",
    site: "ForoMax",
    type: "Acceso revocado",
    fields: [],
  },
];

export const devices = [
  {
    id: "iphone",
    name: "iPhone 15 · App ZeroID",
    role: "Aprueba solicitudes",
    lastSeen: "Hace 2 horas",
    current: false,
  },
  {
    id: "mac",
    name: "MacBook · Safari",
    role: "Sesión del dashboard",
    lastSeen: "Ahora",
    current: true,
  },
];

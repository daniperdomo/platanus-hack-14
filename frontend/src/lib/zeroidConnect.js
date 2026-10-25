// Canal entre el sitio cliente y ZeroID (dashboard o app) dentro del mismo navegador.
// Simula lo que en producción haría el backend con notificaciones push.

import { storedData } from "./mockData";

const CHANNEL = "zeroid-connect";
const PENDING_KEY = "zeroid.pendingRequest";
const CONNECTIONS_KEY = "zeroid.connections";
const ACTIVITY_KEY = "zeroid.activity";

function read(key, fallback) {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

function write(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function broadcast(message) {
  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage(message);
  channel.close();
}

export function subscribe(onMessage) {
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (event) => onMessage(event.data);
  return () => channel.close();
}

export function loadPendingRequest() {
  return read(PENDING_KEY, null);
}

export function requestAuthorization({ client, required, optional }) {
  const request = {
    id: crypto.randomUUID(),
    client,
    required,
    optional,
    createdAt: new Date().toISOString(),
  };
  write(PENDING_KEY, request);
  broadcast({ type: "request", request });
  return request;
}

export function cancelRequest(id) {
  if (loadPendingRequest()?.id === id) window.localStorage.removeItem(PENDING_KEY);
  broadcast({ type: "resolved", id });
}

function now() {
  return new Date().toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

function record(request, approved, fields) {
  const date = now();
  const activity = read(ACTIVITY_KEY, []);
  activity.unshift({
    id: `${request.id}-activity`,
    date,
    site: request.client.name,
    type: approved ? "Nueva conexión autorizada" : "Solicitud rechazada",
    fields,
  });
  write(ACTIVITY_KEY, activity);

  if (!approved) return;

  const purposes = [...request.required, ...request.optional]
    .filter((item) => fields.includes(item.field))
    .map((item) => item.purpose);
  const connections = read(CONNECTIONS_KEY, []).filter(
    (site) => site.id !== request.client.id
  );
  connections.unshift({
    id: request.client.id,
    name: request.client.name,
    domain: request.client.domain,
    status: "activa",
    connectedAt: date.slice(0, 10),
    lastAccess: date,
    fields,
    purpose: purposes.join(" "),
    retention: request.client.retention,
  });
  write(CONNECTIONS_KEY, connections);
}

export function buildAuthorizedData(fields) {
  const values = {
    ...Object.fromEntries(storedData.map((item) => [item.field, item.value])),
    mayor_de_edad: "Sí",
    persona_real_unica: "Verificada",
  };
  return Object.fromEntries(fields.map((field) => [field, values[field]]));
}

export function respond(request, { approved, fields = [] }) {
  window.localStorage.removeItem(PENDING_KEY);
  record(request, approved, approved ? fields : []);

  const data = approved ? buildAuthorizedData(fields) : {};
  broadcast({ type: "resolved", id: request.id });
  broadcast({ type: "response", id: request.id, approved, data: approved ? data : {} });
}

export function loadStoredConnections() {
  return read(CONNECTIONS_KEY, []);
}

export function loadStoredActivity() {
  return read(ACTIVITY_KEY, []);
}

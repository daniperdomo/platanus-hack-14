"use client";

import { useEffect, useState } from "react";
import { accountMe, listConnections } from "@/lib/api";
import { loadVault } from "@/lib/session";
import { useSession } from "./SessionContext";

const EMPTY_VAULT = {
  profile: null,
  storedData: [],
  devices: [],
  connections: [],
  activity: [],
  error: "",
};

function present(site) {
  const when = site.created_at?.slice(0, 16).replace("T", " ") ?? "";
  return {
    id: site.id,
    name: site.client_name,
    domain: site.client_domain || "",
    status: "activa",
    connectedAt: when.slice(0, 10),
    lastAccess: when,
    fields: site.rules,
    purpose: "Autorizado desde tu teléfono.",
    retention: "El sitio recibió solo lo que aprobaste en esa solicitud.",
  };
}

function devicesFor(paired) {
  return [
    { id: "browser", name: "Este navegador", role: "Sesión del dashboard", current: true },
    {
      id: "phone",
      name: "Teléfono · App ZeroID",
      role: paired ? "Aprueba solicitudes" : "Todavía no vinculado",
      current: false,
      lastSeen: paired ? "Vinculado" : "Pendiente",
    },
  ];
}

export default function useVault() {
  const session = useSession();
  const [vault, setVault] = useState(EMPTY_VAULT);

  useEffect(() => {
    if (!session || session.guest) return;
    const decrypted = loadVault() ?? {};
    const storedData = Object.entries(decrypted).map(([field, value]) => ({
      field,
      value: String(value),
    }));
    setVault((current) => ({
      ...current,
      profile: { name: decrypted.nombre || session.username, username: session.username },
      storedData,
      devices: devicesFor(false),
    }));

    listConnections(session.token)
      .then((body) => {
        const connections = body.connections.map(present);
        setVault((current) => ({
          ...current,
          connections,
          activity: connections.map((site) => ({
            id: site.id,
            date: site.lastAccess,
            site: site.name,
            type: "Conexión autorizada",
            fields: site.fields,
          })),
        }));
      })
      .catch((err) =>
        setVault((current) => ({
          ...current,
          error: err?.message ?? "No pudimos leer tus conexiones.",
        }))
      );

    accountMe(session.token)
      .then((account) => setVault((current) => ({ ...current, devices: devicesFor(account.paired) })))
      .catch(() => undefined);
  }, [session]);

  return session?.guest ? EMPTY_VAULT : vault;
}

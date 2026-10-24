"use client";

import { useEffect, useState } from "react";
import { listConnections } from "@/lib/api";
import { loadSession } from "@/lib/session";

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

export default function useVault() {
  const [connections, setConnections] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = loadSession();
    if (!session) return;
    listConnections(session.token)
      .then((body) => setConnections(body.connections.map(present)))
      .catch((err) => setError(err?.message ?? "No pudimos leer tus conexiones."));
  }, []);

  const activity = connections.map((site) => ({
    id: site.id,
    date: site.lastAccess,
    site: site.name,
    type: "Conexión autorizada",
    fields: site.fields,
  }));

  return { connections, activity, error };
}

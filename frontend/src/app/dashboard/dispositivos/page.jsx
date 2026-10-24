"use client";

import { useEffect, useState } from "react";
import { accountMe } from "@/lib/api";
import { loadSession } from "@/lib/session";

export default function DevicesPage() {
  const [paired, setPaired] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (!session) return;
    accountMe(session.token)
      .then((account) => setPaired(account.paired))
      .catch(() => setPaired(false));
  }, []);

  const devices = [
    {
      id: "browser",
      name: "Este navegador",
      role: "Sesión del dashboard",
      current: true,
    },
    {
      id: "phone",
      name: "Teléfono · App ZeroID",
      role: paired ? "Aprueba solicitudes" : "Todavía no vinculado",
      current: false,
    },
  ];

  return (
    <>
      <header className="page-header">
        <span className="section-tag">Seguridad</span>
        <h1 className="page-header__title">Dispositivos</h1>
        <p className="text-muted">
          El teléfono con la app ZeroID es el que aprueba cada inicio de sesión.
        </p>
      </header>

      <section className="panel">
        <ul className="devices">
          {devices.map((device) => (
            <li className="devices__item" key={device.id}>
              <div>
                <strong>{device.name}</strong>
                <span className="text-muted">{device.role}</span>
              </div>
              <span className={`badge${device.current ? "" : " badge--muted"}`}>
                {device.current ? "Este dispositivo" : paired ? "Vinculado" : "Pendiente"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

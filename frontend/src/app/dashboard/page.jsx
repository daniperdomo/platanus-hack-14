"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ActivityList from "@/components/dashboard/ActivityList";
import useVault from "@/components/dashboard/useVault";
import { loadSession, loadVault } from "@/lib/session";

export default function DashboardHome() {
  const { activity, connections } = useVault();
  const [username, setUsername] = useState("");
  const [vaultCount, setVaultCount] = useState(0);

  useEffect(() => {
    setUsername(loadSession()?.username ?? "");
    setVaultCount(Object.keys(loadVault() ?? {}).length);
  }, []);

  const active = connections.filter((site) => site.status === "activa");
  const stats = [
    { label: "Sitios conectados", value: active.length },
    { label: "Datos cifrados en tu bóveda", value: vaultCount },
    { label: "Solicitudes rechazadas", value: activity.filter((a) => a.type.includes("rechazada")).length },
  ];

  return (
    <>
      <header className="page-header">
        <span className="section-tag">Resumen</span>
        <h1 className="page-header__title">Hola, {username}</h1>
        <p className="text-muted">Tu bóveda está cifrada. Cada acceso se confirma en el teléfono.</p>
      </header>

      <div className="stats">
        {stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <span className="stat__value">{stat.value}</span>
            <span className="stat__label">{stat.label}</span>
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="panel__head">
          <h2>Actividad reciente</h2>
          <Link href="/dashboard/actividad" className="panel__link">
            Ver todo
          </Link>
        </div>
        <ActivityList items={activity.slice(0, 4)} />
      </section>
    </>
  );
}

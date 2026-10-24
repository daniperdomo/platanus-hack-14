"use client";

import Link from "next/link";
import ActivityList from "@/components/dashboard/ActivityList";
import useVault from "@/components/dashboard/useVault";
import { profile, storedData } from "@/lib/mockData";

export default function DashboardHome() {
  const { activity, connections } = useVault();
  const active = connections.filter((site) => site.status === "activa");
  const stats = [
    { label: "Sitios conectados", value: active.length },
    { label: "Datos cifrados en tu bóveda", value: storedData.length },
    { label: "Solicitudes rechazadas", value: activity.filter((a) => a.type.includes("rechazada")).length },
  ];

  return (
    <>
      <header className="page-header">
        <span className="section-tag">Resumen</span>
        <h1 className="page-header__title">Hola, {profile.name.split(" ")[0]}</h1>
        <p className="text-muted">
          Identidad verificada el {profile.verifiedAt} · <code>{profile.zeroId}</code>
        </p>
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

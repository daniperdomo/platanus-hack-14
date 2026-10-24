"use client";

import Link from "next/link";
import ActivityList from "@/components/dashboard/ActivityList";
import EmptyState from "@/components/dashboard/EmptyState";
import useVault from "@/components/dashboard/useVault";

export default function DashboardHome() {
  const { activity, connections, profile, storedData } = useVault();
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
        <h1 className="page-header__title">
          Hola, {profile ? profile.name.split(" ")[0] : "invitado"}
        </h1>
        <p className="text-muted">
          {profile
            ? "Tu bóveda está cifrada. Cada acceso se confirma en el teléfono."
            : "Identidad sin verificar"}
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
        {activity.length > 0 ? (
          <ActivityList items={activity.slice(0, 4)} />
        ) : (
          <EmptyState
            title="Sin actividad todavía"
            body="Cuando inicies sesión en sitios con ZeroID, verás aquí cada solicitud."
          />
        )}
      </section>
    </>
  );
}

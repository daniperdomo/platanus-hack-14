"use client";

import ActivityList from "@/components/dashboard/ActivityList";
import EmptyState from "@/components/dashboard/EmptyState";
import useVault from "@/components/dashboard/useVault";

export default function ActivityPage() {
  const { activity } = useVault();

  return (
    <>
      <header className="page-header">
        <span className="section-tag">Trazabilidad</span>
        <h1 className="page-header__title">Actividad</h1>
        <p className="text-muted">
          Registro de cada solicitud que aprobaste o rechazaste desde tu teléfono.
        </p>
      </header>

      <section className="panel">
        {activity.length > 0 ? (
          <ActivityList items={activity} />
        ) : (
          <EmptyState
            title="Sin actividad todavía"
            body="Aquí verás cada solicitud que apruebes o rechaces desde tu teléfono."
          />
        )}
      </section>
    </>
  );
}

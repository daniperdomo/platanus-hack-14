import ActivityList from "@/components/dashboard/ActivityList";
import { activity } from "@/lib/mockData";

export default function ActivityPage() {
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
        <ActivityList items={activity} />
      </section>
    </>
  );
}

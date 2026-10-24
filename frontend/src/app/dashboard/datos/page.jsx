"use client";

import EmptyState from "@/components/dashboard/EmptyState";
import useVault from "@/components/dashboard/useVault";
import { DATA_FIELDS } from "@/lib/mockData";

export default function DataPage() {
  const { connections, storedData } = useVault();
  const sharedWith = (field) =>
    connections.filter((site) => site.status === "activa" && site.fields.includes(field));

  return (
    <>
      <header className="page-header">
        <span className="section-tag">Bóveda cifrada</span>
        <h1 className="page-header__title">Mis datos</h1>
        <p className="text-muted">
          Tus datos se guardan cifrados. Solo se comparten cuando apruebas una
          solicitud desde tu teléfono.
        </p>
      </header>

      <section className="panel">
        {storedData.length === 0 ? (
          <EmptyState
            title="Tu bóveda está vacía"
            body="Verifica tu identidad para guardar tus datos cifrados y decidir con quién compartirlos."
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Dato</th>
                <th>Valor</th>
                <th>Compartido con</th>
              </tr>
            </thead>
            <tbody>
              {storedData.map(({ field, value }) => {
                const sites = sharedWith(field);
                return (
                  <tr key={field}>
                    <td>{DATA_FIELDS[field]}</td>
                    <td>
                      <code>{value}</code>
                    </td>
                    <td className="text-muted">
                      {sites.length > 0 ? sites.map((site) => site.name).join(", ") : "Nadie"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

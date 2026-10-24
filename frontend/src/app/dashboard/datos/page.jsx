"use client";

import { useEffect, useState } from "react";
import useVault from "@/components/dashboard/useVault";
import { DATA_FIELDS } from "@/lib/mockData";
import { loadVault } from "@/lib/session";

export default function DataPage() {
  const { connections } = useVault();
  const [vault, setVault] = useState(null);
  const sharedWith = (field) =>
    connections.filter((site) => site.status === "activa" && site.fields.includes(field));

  useEffect(() => setVault(loadVault()), []);

  return (
    <>
      <header className="page-header">
        <span className="section-tag">Bóveda cifrada</span>
        <h1 className="page-header__title">Mis datos</h1>
        <p className="text-muted">
          Se descifran en este navegador con la contraseña de esta sesión. El
          servidor solo guarda el cifrado.
        </p>
      </header>

      <section className="panel">
        {vault && Object.keys(vault).length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Dato</th>
                <th>Valor</th>
                <th>Compartido con</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(vault).map(([field, value]) => {
                const sites = sharedWith(field);
                return (
                  <tr key={field}>
                    <td>{DATA_FIELDS[field] ?? field}</td>
                    <td>
                      <code>{String(value)}</code>
                    </td>
                    <td className="text-muted">
                      {sites.length > 0 ? sites.map((site) => site.name).join(", ") : "Nadie"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-muted">
            Vuelve a iniciar sesión en esta pestaña para descifrar tu bóveda.
          </p>
        )}
      </section>
    </>
  );
}

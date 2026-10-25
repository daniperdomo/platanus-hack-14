"use client";

import { useEffect, useState } from "react";
import FieldTags from "@/components/dashboard/FieldTags";
import EmptyState from "@/components/dashboard/EmptyState";
import useVault from "@/components/dashboard/useVault";

export default function SitesPage() {
  const vault = useVault();
  const [connections, setConnections] = useState(vault.connections);

  useEffect(() => setConnections(vault.connections), [vault.connections]);

  function revoke(id) {
    setConnections((current) =>
      current.map((site) =>
        site.id === id
          ? { ...site, status: "revocada", retention: "Eliminado tras revocar el acceso." }
          : site
      )
    );
  }

  return (
    <>
      <header className="page-header">
        <span className="section-tag">Trazabilidad</span>
        <h1 className="page-header__title">Sitios conectados</h1>
        <p className="text-muted">
          Cada sitio donde usaste ZeroID, qué datos recibe y para qué los usa.
        </p>
      </header>

      {connections.length === 0 && (
        <section className="panel">
          <EmptyState
            title="Aún no te conectas a ningún sitio"
            body="Cuando uses “Continuar con ZeroID”, verás aquí qué datos recibe cada sitio y para qué los usa."
            showAction={false}
          />
        </section>
      )}

      <div className="sites">
        {connections.map((site) => (
          <article className="site-card" key={site.id}>
            <div className="site-card__head">
              <span className="site-card__avatar">{site.name[0]}</span>
              <div>
                <h2>{site.name}</h2>
                <span className="text-muted">{site.domain}</span>
              </div>
              <span className={`badge${site.status === "activa" ? "" : " badge--muted"}`}>
                {site.status === "activa" ? "Activa" : "Revocada"}
              </span>
            </div>

            <dl className="site-card__details">
              <dt>Datos compartidos</dt>
              <dd>
                <FieldTags fields={site.fields} />
              </dd>
              <dt>Uso declarado</dt>
              <dd>{site.purpose}</dd>
              <dt>Retención</dt>
              <dd>{site.retention}</dd>
              <dt>Conectado</dt>
              <dd>
                {site.connectedAt} · último acceso {site.lastAccess}
              </dd>
            </dl>

            {site.status === "activa" && (
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => revoke(site.id)}
              >
                Revocar acceso
              </button>
            )}
          </article>
        ))}
      </div>
    </>
  );
}

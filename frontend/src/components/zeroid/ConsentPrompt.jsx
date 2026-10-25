"use client";

import { useState } from "react";
import CompanyDetail from "@/components/analytics/CompanyDetail";
import { DATA_FIELDS } from "@/lib/mockData";
import { companyForClient } from "@/lib/trustData";
import { buildAuthorizedData } from "@/lib/zeroidConnect";

function DataItem({ item, checked, locked, onToggle }) {
  return (
    <li className="consent-item">
      <label className="consent-item__head">
        <input
          type="checkbox"
          checked={checked}
          disabled={locked}
          onChange={onToggle}
        />
        <strong>{DATA_FIELDS[item.field] ?? item.field}</strong>
      </label>
      <div className="consent-item__meta">
        <div className="consent-item__row">
          <span className="consent-item__label">Para qué</span>
          <p>{item.purpose}</p>
        </div>
        <div className="consent-item__row">
          <span className="consent-item__label">Cuánto tiempo</span>
          <p>{item.retention}</p>
        </div>
      </div>
    </li>
  );
}

export default function ConsentPrompt({ request, onRespond, initialStep = "identity" }) {
  const [step, setStep] = useState(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [optional, setOptional] = useState(() =>
    Object.fromEntries(request.optional.map((item) => [item.field, false]))
  );

  function toggle(field) {
    setOptional((current) => ({ ...current, [field]: !current[field] }));
  }

  async function authorize() {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const fields = [
      ...request.required.map((item) => item.field),
      ...request.optional.filter((item) => optional[item.field]).map((item) => item.field),
    ];
    const payload = buildAuthorizedData(fields);
    console.log("🛡️ [ZeroID Core] Payload filtrado criptográficamente:", payload);
    onRespond({ approved: true, fields, payload });
  }

  function reject() {
    onRespond({ approved: false });
  }

  const client = request.client;
  const company = companyForClient(client);

  if (step === "identity") {
    return (
      <div className="auth-page">
        <div className="auth-page__identity">
          <span className="consent__avatar" style={{ background: client.color }}>
            {client.name[0]}
          </span>
          <h1 className="auth-page__title">¿Eres tú quien intenta iniciar sesión?</h1>
          <p className="auth-page__lead">
            <strong>{client.name}</strong> ({client.domain}) quiere que inicies sesión con tu ZeroID.
          </p>
        </div>
        <footer className="auth-page__footer">
          <div className="consent__actions auth-page__identity-actions">
            <button type="button" className="btn btn--primary" onClick={() => setStep("data")}>
              Sí, soy yo
            </button>
            <button type="button" className="btn btn--secondary" onClick={reject}>
              No soy yo
            </button>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page__split">
        <section className="auth-page__context">
          <header className="auth-page__header">
            <div className="auth-page__brand">
              <span className="consent__avatar" style={{ background: client.color }}>
                {client.name[0]}
              </span>
              <p className="auth-page__eyebrow">{client.domain}</p>
            </div>
            <h1 className="auth-page__title">{client.name} solicita acceso</h1>
            <p className="auth-page__lead">
              Revisa el grado de confianza y las advertencias antes de decidir qué compartir.
            </p>
          </header>

          {company ? (
            <div className="consent__dossier">
              <CompanyDetail company={company} />
            </div>
          ) : null}
        </section>

        <section className="auth-page__control">
          <div className="auth-page__scroll">
            <h2 className="auth-page__selector-title">Selecciona qué datos compartir</h2>
            <p className="auth-page__lead">
              Revisa qué datos pide, para qué los usará y cuánto tiempo los guardará.
            </p>

            <div className="consent__permissions">
              <div className="consent__group">
                <span className="section-tag">Obligatorios</span>
                <ul className="consent__list">
                  {request.required.map((item) => (
                    <DataItem key={item.field} item={item} checked locked />
                  ))}
                </ul>
              </div>

              {request.optional.length > 0 && (
                <div className="consent__group">
                  <span className="section-tag">Opcionales</span>
                  <ul className="consent__list">
                    {request.optional.map((item) => (
                      <DataItem
                        key={item.field}
                        item={item}
                        checked={optional[item.field]}
                        onToggle={() => toggle(item.field)}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <p className="consent__note">
              Puedes revocar este acceso cuando quieras desde Sitios conectados.
            </p>
          </div>

          <footer className="auth-page__footer">
            <div className="consent__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={authorize}
                disabled={isLoading}
              >
                {isLoading ? "Generando firma (JWK)..." : "Firmar y Autorizar"}
              </button>
              <button type="button" className="btn btn--secondary" onClick={reject} disabled={isLoading}>
                Cancelar
              </button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}

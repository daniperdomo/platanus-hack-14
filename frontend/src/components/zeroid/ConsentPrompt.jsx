"use client";

import { useState } from "react";
import CompanyDetail from "@/components/analytics/CompanyDetail";
import { DATA_FIELDS } from "@/lib/mockData";
import { companyById, trustCompanies } from "@/lib/trustData";
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

export default function ConsentPrompt({ request, onRespond }) {
  const [step, setStep] = useState("identity");
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
    onRespond({ approved: true, fields });
  }

  function reject() {
    onRespond({ approved: false });
  }

  const client = request.client;
  const company =
    companyById(client?.id) ?? trustCompanies.find((item) => item.domain === client?.domain);

  if (step === "identity") {
    return (
      <div className="sdk-auth-modal">
        <div className="sdk-auth-modal__body">
          <div className="consent">
            <span className="consent__avatar" style={{ background: client.color }}>
              {client.name[0]}
            </span>
            <h2 className="consent__title">¿Eres tú quien intenta iniciar sesión?</h2>
            <p className="text-muted">
              <strong>{client.name}</strong> ({client.domain}) quiere que inicies
              sesión con tu ZeroID.
            </p>
          </div>
        </div>
        <footer className="sdk-auth-modal__footer">
          <div className="consent__actions">
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
    <div className="sdk-auth-modal">
      <div className="sdk-auth-modal__body">
        <div className="consent consent--wide">
          <div className="consent__intro">
            <h2 className="consent__title">
              {client.name} solicita acceso a tus datos
            </h2>
            <p className="text-muted">
              Revisa qué datos pide, para qué los usará y cuánto tiempo los guardará.
            </p>
          </div>

          {company ? (
            <div className="consent__dossier">
              <CompanyDetail company={company} />
            </div>
          ) : null}

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
                <ul className="consent__list consent__list--optional">
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
      </div>
      <footer className="sdk-auth-modal__footer">
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
    </div>
  );
}

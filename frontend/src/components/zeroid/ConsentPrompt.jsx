"use client";

import { useState } from "react";
import { DATA_FIELDS } from "@/lib/mockData";

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
      <dl className="consent-item__details">
        <dt>Para qué</dt>
        <dd>{item.purpose}</dd>
        <dt>Cuánto tiempo</dt>
        <dd>{item.retention}</dd>
      </dl>
    </li>
  );
}

export default function ConsentPrompt({ request, onRespond }) {
  const [step, setStep] = useState("identity");
  const [optional, setOptional] = useState(() =>
    Object.fromEntries(request.optional.map((item) => [item.field, false]))
  );

  function toggle(field) {
    setOptional((current) => ({ ...current, [field]: !current[field] }));
  }

  function authorize() {
    const fields = [
      ...request.required.map((item) => item.field),
      ...request.optional.filter((item) => optional[item.field]).map((item) => item.field),
    ];
    onRespond({ approved: true, fields });
  }

  function reject() {
    onRespond({ approved: false });
  }

  const client = request.client;

  if (step === "identity") {
    return (
      <div className="consent">
        <span className="consent__avatar" style={{ background: client.color }}>
          {client.name[0]}
        </span>
        <h2 className="consent__title">¿Eres tú quien intenta iniciar sesión?</h2>
        <p className="text-muted">
          <strong>{client.name}</strong> ({client.domain}) quiere que inicies
          sesión con tu ZeroID.
        </p>
        <div className="consent__actions">
          <button type="button" className="btn btn--primary" onClick={() => setStep("data")}>
            Sí, soy yo
          </button>
          <button type="button" className="btn btn--secondary" onClick={reject}>
            No soy yo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="consent">
      <h2 className="consent__title">
        {client.name} solicita acceso a tus datos
      </h2>
      <p className="text-muted">
        Revisa qué datos pide, para qué los usará y cuánto tiempo los guardará.
      </p>

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

      <div className="consent__actions">
        <button type="button" className="btn btn--primary" onClick={authorize}>
          Autorizar
        </button>
        <button type="button" className="btn btn--secondary" onClick={reject}>
          Cancelar
        </button>
      </div>
      <p className="consent__note">
        Puedes revocar este acceso cuando quieras desde Sitios conectados.
      </p>
    </div>
  );
}

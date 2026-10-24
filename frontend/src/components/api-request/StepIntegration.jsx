import { DATA_FIELDS } from "@/lib/mockData";
import Field from "./Field";

const MODES = [
  { value: "none", label: "No" },
  { value: "required", label: "Obligatorio" },
  { value: "optional", label: "Opcional" },
];

export default function StepIntegration({ data, errors, onChange, onFieldChange }) {
  const requestsDocument = data.fields.documento.mode !== "none";

  return (
    <>
      <div className="form-grid">
        <Field
          label="Dominios autorizados"
          hint="Uno por línea, con https://. Solo desde aquí se podrá mostrar el botón."
          error={errors.domains}
          full
        >
          <textarea
            rows={3}
            value={data.domains}
            onChange={(event) => onChange("domains", event.target.value)}
            placeholder={"https://expresocaribe.com\nhttps://app.expresocaribe.com"}
          />
        </Field>
        <Field
          label="URL de redirección"
          hint="Adonde volverá el usuario después de autorizar."
          error={errors.redirectUri}
          full
        >
          <input
            type="url"
            value={data.redirectUri}
            onChange={(event) => onChange("redirectUri", event.target.value)}
            placeholder="https://expresocaribe.com/auth/zeroid/callback"
          />
        </Field>
      </div>

      <h3 className="form-subtitle">Datos que solicitarán a los usuarios</h3>
      <p className="form-help">
        Para cada dato, indica si es obligatorio u opcional, para qué lo usarán y
        cuánto tiempo lo conservarán. Esto es lo que verá el usuario al autorizar.
      </p>
      {errors.fields && <p className="field__error">{errors.fields}</p>}

      <ul className="data-requests">
        {Object.entries(DATA_FIELDS).map(([field, label]) => {
          const request = data.fields[field];
          const active = request.mode !== "none";
          return (
            <li key={field} className={`data-request${active ? " is-active" : ""}`}>
              <div className="data-request__head">
                <strong>{label}</strong>
                <div className="segmented" role="radiogroup" aria-label={label}>
                  {MODES.map((mode) => (
                    <button
                      type="button"
                      key={mode.value}
                      role="radio"
                      aria-checked={request.mode === mode.value}
                      className={request.mode === mode.value ? "is-active" : ""}
                      onClick={() => onFieldChange(field, "mode", mode.value)}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
              {active && (
                <div className="form-grid">
                  <Field label="Para qué lo usarán" error={errors[`${field}.purpose`]}>
                    <input
                      value={request.purpose}
                      onChange={(event) => onFieldChange(field, "purpose", event.target.value)}
                      placeholder="Emitir el boleto a nombre del pasajero"
                    />
                  </Field>
                  <Field label="Cuánto tiempo lo conservarán" error={errors[`${field}.retention`]}>
                    <input
                      value={request.retention}
                      onChange={(event) => onFieldChange(field, "retention", event.target.value)}
                      placeholder="1 año después del viaje"
                    />
                  </Field>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <label className="check">
        <input
          type="checkbox"
          checked={data.sensitive || requestsDocument}
          disabled={requestsDocument}
          onChange={(event) => onChange("sensitive", event.target.checked)}
        />
        <span>
          Tratamos datos sensibles (biometría, salud, documentos de identidad, menores de edad…)
          {requestsDocument && (
            <span className="field__hint">
              {" "}
              Marcado porque solicitan el número de documento.
            </span>
          )}
        </span>
      </label>
    </>
  );
}

import { DOCUMENTS } from "@/lib/apiRequest";
import { DATA_FIELDS } from "@/lib/mockData";
import Field from "./Field";

export default function StepReview({ form, errors, onChange, onEdit }) {
  const { company, contacts, integration, documents, declaration } = form;
  const requested = Object.entries(integration.fields).filter(
    ([, request]) => request.mode !== "none"
  );
  const attached = DOCUMENTS.filter((document) => documents[document.key].length > 0);

  return (
    <>
      <div className="review">
        <section className="review__block">
          <div className="review__head">
            <h3>Empresa</h3>
            <button type="button" onClick={() => onEdit(0)}>Editar</button>
          </div>
          <p>
            {company.tradeName} · {company.legalName} · {company.taxId}
          </p>
          <p className="text-muted">
            {company.country} · {company.sector} · {company.size} empleados · {company.website}
          </p>
        </section>

        <section className="review__block">
          <div className="review__head">
            <h3>Contactos</h3>
            <button type="button" onClick={() => onEdit(1)}>Editar</button>
          </div>
          <p>
            Técnico: {contacts.techName} ({contacts.techRole}) · {contacts.techEmail}
          </p>
          <p className="text-muted">
            Datos personales:{" "}
            {contacts.dpoSame ? "mismo responsable" : `${contacts.dpoName} · ${contacts.dpoEmail}`}
          </p>
        </section>

        <section className="review__block">
          <div className="review__head">
            <h3>Integración</h3>
            <button type="button" onClick={() => onEdit(2)}>Editar</button>
          </div>
          <p className="text-muted">{integration.domains.split("\n").filter(Boolean).join(" · ")}</p>
          <ul className="review__list">
            {requested.map(([field, request]) => (
              <li key={field}>
                <strong>{DATA_FIELDS[field]}</strong>{" "}
                <span className="text-muted">
                  ({request.mode === "required" ? "obligatorio" : "opcional"}) · {request.purpose} ·{" "}
                  {request.retention}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="review__block">
          <div className="review__head">
            <h3>Documentos</h3>
            <button type="button" onClick={() => onEdit(3)}>Editar</button>
          </div>
          <ul className="review__list">
            {attached.map((document) => (
              <li key={document.key}>
                <strong>{document.title}:</strong>{" "}
                <span className="text-muted">
                  {documents[document.key].map((file) => file.name).join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <h3 className="form-subtitle">Declaración jurada</h3>
      <div className="form-grid">
        <Field label="Nombre del representante legal" error={errors.signer}>
          <input
            value={declaration.signer}
            onChange={(event) => onChange("signer", event.target.value)}
          />
        </Field>
        <Field label="Cargo" error={errors.signerRole}>
          <input
            value={declaration.signerRole}
            onChange={(event) => onChange("signerRole", event.target.value)}
            placeholder="Gerente general"
          />
        </Field>
      </div>
      <label className={`check${errors.sworn ? " has-error" : ""}`}>
        <input
          type="checkbox"
          checked={declaration.sworn}
          onChange={(event) => onChange("sworn", event.target.checked)}
        />
        Declaro bajo juramento que los documentos adjuntos son auténticos y
        reflejan cómo {company.tradeName || "la empresa"} trata los datos personales.
      </label>
      <label className={`check${errors.terms ? " has-error" : ""}`}>
        <input
          type="checkbox"
          checked={declaration.terms}
          onChange={(event) => onChange("terms", event.target.checked)}
        />
        Acepto que ZeroID evalúe estos documentos para calcular el Trust Score de la
        empresa y los términos de uso de la API.
      </label>
      {(errors.sworn || errors.terms) && (
        <p className="field__error">Debes aceptar ambas declaraciones para continuar.</p>
      )}
    </>
  );
}

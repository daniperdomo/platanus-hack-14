import { DOCUMENTS, isDocumentRequired } from "@/lib/apiRequest";
import FileDrop from "./FileDrop";

function requirementLabel(document, sensitive) {
  if (isDocumentRequired(document, sensitive)) return "Obligatorio";
  if (document.required === "sensitive") return "Solo con datos sensibles";
  return "Opcional";
}

export default function StepDocuments({ documents, sensitive, errors, onChange }) {
  const uploaded = DOCUMENTS.filter(
    (document) => isDocumentRequired(document, sensitive) && documents[document.key].length > 0
  ).length;
  const required = DOCUMENTS.filter((document) => isDocumentRequired(document, sensitive)).length;

  return (
    <>
      <p className="form-help">
        Con estos documentos evaluaremos cómo tu empresa maneja los datos
        personales. Puedes subir un mismo archivo en varias categorías si lo
        cubre.
      </p>
      <p className="docs-progress">
        <strong>
          {uploaded} de {required}
        </strong>{" "}
        documentos obligatorios adjuntos
      </p>

      <ul className="doc-list">
        {DOCUMENTS.map((document) => {
          const isRequired = isDocumentRequired(document, sensitive);
          return (
            <li
              key={document.key}
              className={`doc-item${errors[document.key] ? " has-error" : ""}`}
            >
              <div className="doc-item__head">
                <div>
                  <strong>{document.title}</strong>
                  <p>{document.description}</p>
                </div>
                <span className={`badge${isRequired ? "" : " badge--muted"}`}>
                  {requirementLabel(document, sensitive)}
                </span>
              </div>
              <FileDrop
                files={documents[document.key]}
                multiple={document.multiple}
                onChange={(files) => onChange(document.key, files)}
              />
              {errors[document.key] && (
                <span className="field__error">{errors[document.key]}</span>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

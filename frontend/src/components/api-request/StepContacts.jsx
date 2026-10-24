import Field from "./Field";

export default function StepContacts({ data, errors, onChange }) {
  const bind = (key) => ({
    value: data[key],
    onChange: (event) => onChange(key, event.target.value),
  });

  return (
    <>
      <h3 className="form-subtitle">Responsable técnico de la integración</h3>
      <div className="form-grid">
        <Field label="Nombre completo" error={errors.techName}>
          <input {...bind("techName")} />
        </Field>
        <Field label="Cargo" error={errors.techRole}>
          <input {...bind("techRole")} placeholder="CTO, Líder técnico…" />
        </Field>
        <Field label="Correo corporativo" error={errors.techEmail}>
          <input {...bind("techEmail")} type="email" placeholder="nombre@empresa.com" />
        </Field>
        <Field label="Teléfono" optional error={errors.techPhone}>
          <input {...bind("techPhone")} type="tel" placeholder="+58 412 000 0000" />
        </Field>
      </div>

      <h3 className="form-subtitle">Responsable de protección de datos</h3>
      <label className="check">
        <input
          type="checkbox"
          checked={data.dpoSame}
          onChange={(event) => onChange("dpoSame", event.target.checked)}
        />
        Es la misma persona que el responsable técnico
      </label>
      {!data.dpoSame && (
        <div className="form-grid">
          <Field label="Nombre completo" error={errors.dpoName}>
            <input {...bind("dpoName")} />
          </Field>
          <Field label="Correo" error={errors.dpoEmail}>
            <input {...bind("dpoEmail")} type="email" placeholder="privacidad@empresa.com" />
          </Field>
        </div>
      )}
    </>
  );
}

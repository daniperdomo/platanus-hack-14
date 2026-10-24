import { COUNTRIES, SECTORS, SIZES } from "@/lib/apiRequest";
import Field from "./Field";

export default function StepCompany({ data, errors, onChange }) {
  const bind = (key) => ({
    value: data[key],
    onChange: (event) => onChange(key, event.target.value),
  });

  return (
    <div className="form-grid">
      <Field label="Razón social" error={errors.legalName}>
        <input {...bind("legalName")} placeholder="Expreso Caribe C.A." />
      </Field>
      <Field label="Nombre comercial" error={errors.tradeName}>
        <input {...bind("tradeName")} placeholder="Expreso Caribe" />
      </Field>
      <Field label="Identificación fiscal" hint="RIF, RUT, NIT, CUIT, RFC…" error={errors.taxId}>
        <input {...bind("taxId")} placeholder="J-12345678-9" />
      </Field>
      <Field label="País de constitución" error={errors.country}>
        <select {...bind("country")}>
          <option value="">Selecciona un país</option>
          {COUNTRIES.map((country) => (
            <option key={country}>{country}</option>
          ))}
        </select>
      </Field>
      <Field label="Sitio web" error={errors.website}>
        <input {...bind("website")} type="url" placeholder="https://expresocaribe.com" />
      </Field>
      <Field label="Sector" error={errors.sector}>
        <select {...bind("sector")}>
          <option value="">Selecciona un sector</option>
          {SECTORS.map((sector) => (
            <option key={sector}>{sector}</option>
          ))}
        </select>
      </Field>
      <Field label="Número de empleados" error={errors.size}>
        <select {...bind("size")}>
          <option value="">Selecciona un rango</option>
          {SIZES.map((size) => (
            <option key={size}>{size}</option>
          ))}
        </select>
      </Field>
    </div>
  );
}

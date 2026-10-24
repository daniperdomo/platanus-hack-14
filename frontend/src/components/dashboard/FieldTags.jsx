import { DATA_FIELDS } from "@/lib/mockData";

export default function FieldTags({ fields }) {
  if (fields.length === 0) return <span className="text-muted">Ningún dato</span>;

  return (
    <div className="field-tags">
      {fields.map((field) => (
        <span className="field-tag" key={field}>
          {DATA_FIELDS[field] ?? field}
        </span>
      ))}
    </div>
  );
}

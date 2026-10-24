export default function Field({ label, error, hint, optional = false, full = false, children }) {
  return (
    <label className={`field${full ? " field--full" : ""}${error ? " has-error" : ""}`}>
      <span className="field__label">
        {label}
        {optional && <span className="field__optional"> (opcional)</span>}
      </span>
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}

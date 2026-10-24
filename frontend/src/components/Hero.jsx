const requested = [
  { label: "Nombre completo", purpose: "Emitir tu boleto", required: true },
  { label: "Número de documento", purpose: "Validarte al abordar", required: true },
  { label: "Teléfono", purpose: "Avisos de retrasos", required: false },
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__grid">
        <div className="hero__content">
          <h1 className="hero__title">
            Tu identidad verificada.{" "}
            <span className="text-muted">Bajo tu control.</span>
          </h1>
          <p className="hero__lead">
            Verifícate una sola vez y entra a cualquier sitio con un clic.
            Apruebas cada acceso desde tu teléfono y decides qué datos compartes,
            para qué se usan y por cuánto tiempo.
          </p>
          <div className="hero__actions">
            <a href="#cta" className="btn btn--primary">
              Crear mi ZeroID
            </a>
            <a href="#empresas" className="btn btn--secondary">
              Soy empresa
            </a>
          </div>
        </div>

        <div className="hero__preview">
          <div className="terminal-card">
            <div className="terminal-card__header">
              <span className="terminal-dot" />
              <span className="terminal-title">App ZeroID · Solicitud de acceso</span>
            </div>

            <div className="terminal-card__body">
              <p className="preview__title">
                <strong>Expreso Caribe</strong> quiere que inicies sesión con
                ZeroID
              </p>

              <ul className="preview__list">
                {requested.map((item) => (
                  <li className="preview__item" key={item.label}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.purpose}</span>
                    </div>
                    <span className={`badge${item.required ? "" : " badge--muted"}`}>
                      {item.required ? "Obligatorio" : "Opcional"}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="status-pill">
                <span className="status-icon">✓</span>
                <span>Autorizado · solo 2 datos compartidos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

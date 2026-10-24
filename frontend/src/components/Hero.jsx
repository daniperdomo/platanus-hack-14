const claims = [
  "persona_real_unica: true",
  "mayor_de_edad: true",
  'nacionalidad: "CL"',
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__grid">
        <div className="hero__content">
          <h1 className="hero__title">
            Demuestra que eres real.{" "}
            <span className="text-muted">Sin dar tus datos personales.</span>
          </h1>
          <p className="hero__lead">
            Regístrate e inicia sesión en sitios web demostrando que eres una
            persona real, mayor de edad o residente. Las plataformas validan la
            regla al instante; tú nunca entregas tu carnet, tu foto ni tu
            nombre.
          </p>
          <div className="hero__actions">
            <a href="/registrar" className="btn btn--primary">
              Quiero mi credencial
            </a>
            <a href="#solucion" className="btn btn--secondary">
              Cómo funciona
            </a>
          </div>
        </div>

        <div className="hero__preview">
          <div className="terminal-card">
            <div className="terminal-card__header">
              <span className="terminal-dot" />
              <span className="terminal-title">solicitud_verificacion.zk</span>
            </div>

            <div className="terminal-card__body">
              <div className="flow-step">
                <span className="flow-step__dot" />
                <span className="flow-step__line" />
                <div className="flow-step__content">
                  <span className="flow-label">Sitio web solicita regla</span>
                  <code>GET /auth/verify?rule=humano_unico&amp;mayor_edad</code>
                </div>
              </div>

              <div className="flow-step">
                <span className="flow-step__dot" />
                <span className="flow-step__line" />
                <div className="flow-step__content">
                  <span className="flow-label">
                    Tu dispositivo responde sin exponer datos
                  </span>
                  <div className="token-box">
                    {claims.map((claim) => (
                      <div className="token-row" key={claim}>
                        <code>{claim}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flow-step flow-step--success">
                <span className="flow-step__dot" />
                <div className="flow-step__content">
                  <div className="status-pill">
                    <span className="status-icon">✓</span>
                    <span>Acceso concedido · 0 datos compartidos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

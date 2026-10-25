const benefits = [
  {
    num: "01",
    title: "Usuarios verificados en un clic",
    body: "Recibe personas con identidad ya validada (documento y prueba de vida) sin formularios ni subir fotos. Menos abandono en el registro.",
  },
  {
    num: "02",
    title: "Menos fraude y bots",
    body: "Cada ZeroID corresponde a una persona real y única. Se acabaron las cuentas duplicadas, falsas o automatizadas.",
  },
  {
    num: "03",
    title: "Cumplimiento sin esfuerzo",
    body: "Cada dato llega con consentimiento registrado, propósito declarado y plazo de retención. Pides solo lo necesario y queda auditado.",
  },
];

const snippet = `<button onClick={() => zeroid.signIn({
  required: [
    { field: "nombre",    purpose: "Emitir tu boleto" },
    { field: "documento", purpose: "Validarte al abordar" },
  ],
  optional: [
    { field: "telefono",  purpose: "Avisos de retrasos" },
  ],
})}>
  Continuar con ZeroID
</button>`;

export default function BusinessSection() {
  return (
    <section className="section section--bordered" id="empresas">
      <div className="container">
        <div className="section__header">
          <span className="section-tag">Para empresas</span>
          <h2 className="section__title">
            Clientes verificados, sin cargar con el riesgo de sus datos.
          </h2>
          <p className="section__desc">
            Integra ZeroID como integrarías &quot;Iniciar sesión con Google&quot;,
            pero con identidad real verificada y consentimiento auditable.
          </p>
        </div>

        <div className="cards-grid">
          {benefits.map((card) => (
            <article className="feature-card" key={card.num}>
              <div className="feature-card__num">{card.num}</div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>

        <div className="integration flex flex-col md:flex-row">
          <div className="integration__copy">
            <span className="section-tag">Integración en minutos</span>
            <h3>Declara qué necesitas y para qué. Nosotros hacemos el resto.</h3>
            <p className="text-muted">
              Un botón y una llamada. Defines los datos obligatorios, los
              opcionales y el propósito de cada uno; el usuario aprueba desde su
              teléfono y tú recibes solo lo autorizado.
            </p>
            <div className="hero__actions">
              <a href="/empresas/solicitar-api" className="btn btn--primary">
                Solicitar API
              </a>
              <a href="/autobuses" className="btn btn--secondary">
                Ver demo en vivo
              </a>
            </div>
          </div>
          <pre className="code-block">
            <code>{snippet}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}

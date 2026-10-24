import Link from "next/link";

export default function Waitlist() {
  return (
    <section className="section section--cta" id="cta">
      <div className="container">
        <div className="cta-box">
          <h2 className="cta-title">Tus datos, tus reglas.</h2>
          <p className="cta-subtitle">
            Empieza a usar ZeroID como persona o intégralo en tu plataforma.
          </p>
        </div>

        <div className="cta-grid">
          <article className="cta-card">
            <span className="section-tag">Para personas</span>
            <h3>Crea tu ZeroID gratis</h3>
            <p className="text-muted">
              Verifícate una vez y entra a sitios afiliados sin volver a subir tu
              documento.
            </p>
            <Link href="/login" className="btn btn--primary">
              Crear mi ZeroID
            </Link>
          </article>

          <article className="cta-card">
            <span className="section-tag">Para empresas</span>
            <h3>Integra ZeroID en tu plataforma</h3>
            <p className="text-muted">
              Adjunta la documentación de cómo manejas los datos personales y
              recibe tus credenciales al instante.
            </p>
            <Link href="/empresas/solicitar-api" className="btn btn--primary">
              Solicitar API
            </Link>
            <Link href="/autobuses" className="cta-card__link">
              Ver demo en vivo →
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

export default function Waitlist() {
  return (
    <section className="section section--cta" id="cta">
      <div className="container">
        <div className="cta-box">
          <h2 className="cta-title">
            Tus datos personales no son el precio de entrada.
          </h2>
          <p className="cta-subtitle">
            Fotografía tu cédula o pasaporte. La imagen se lee en memoria y se
            destruye: no se guarda en ningún servidor.
          </p>
          <Link href="/registrar" className="btn btn--primary">
            Quiero mi credencial
          </Link>
        </div>
      </div>
    </section>
  );
}

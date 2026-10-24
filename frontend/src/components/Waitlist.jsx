"use client";

import { useState } from "react";
import Link from "next/link";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  function onSubmit(event) {
    event.preventDefault();
    const valid = EMAIL_PATTERN.test(email.trim());
    setError(!valid);

    if (!valid) {
      setMessage("Ingresa un correo válido.");
      return;
    }

    setMessage("¡Gracias! Te contactaremos para integrar ZeroID.");
    setEmail("");
  }

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
              Déjanos tu correo y te ayudamos a integrarlo, o prueba la demo en
              vivo.
            </p>
            <form className="cta-form" onSubmit={onSubmit} noValidate>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@empresa.com"
                required
                aria-label="Correo de tu empresa"
              />
              <button type="submit" className="btn btn--primary">
                Contactar
              </button>
            </form>
            <p
              className={`cta-status${error ? " is-error" : ""}`}
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
            <Link href="/autobuses" className="cta-card__link">
              Ver demo en vivo →
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}

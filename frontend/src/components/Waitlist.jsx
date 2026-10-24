"use client";

import { useState } from "react";

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

    setMessage("¡Listo! Te avisaremos cuando abramos el acceso. 🔐");
    setEmail("");
  }

  return (
    <section className="section section--cta" id="cta">
      <div className="container">
        <div className="cta-box">
          <h2 className="cta-title">
            Tus datos personales no son el precio de entrada.
          </h2>
          <p className="cta-subtitle">
<<<<<<< Updated upstream
            Únete al acceso anticipado para probar la verificación privada de
            identidad.
          </p>

          <form className="cta-form" onSubmit={onSubmit} noValidate>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              required
              aria-label="Correo electrónico"
            />
            <button type="submit" className="btn btn--primary">
              Quiero acceso
            </button>
          </form>
          <p
            className={`cta-status${error ? " is-error" : ""}`}
            role="status"
            aria-live="polite"
          >
            {message}
=======
            Fotografía tu pasaporte. La imagen se lee en memoria y se
            destruye: no se guarda en ningún servidor.
>>>>>>> Stashed changes
          </p>
        </div>
      </div>
    </section>
  );
}

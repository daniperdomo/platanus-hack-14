"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startGuestSession, startSession } from "@/lib/session";
import BrandLogo from "@/components/BrandLogo";
import ThemeSwitcher from "@/components/ThemeSwitcher";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email");
  const [message, setMessage] = useState("");

  function onSubmit(event) {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setMessage("Ingresa un correo válido.");
      return;
    }
    setMessage("");
    setStep("waiting");
  }

  function approve() {
    startSession(email.trim());
    router.push("/dashboard");
  }

  function enterAsGuest() {
    startGuestSession();
    router.push("/dashboard");
  }

  function reject() {
    setStep("email");
    setMessage("Solicitud rechazada desde tu teléfono.");
  }

  return (
    <main className="auth">
      <div className="auth__top">
        <Link href="/" className="nav__brand auth__brand" aria-label="ZeroID">
          <BrandLogo variant="lockup" />
        </Link>
        <ThemeSwitcher />
      </div>

      {step === "email" ? (
        <div className="auth-card">
          <h1 className="auth-card__title">Inicia sesión</h1>
          <p className="text-muted auth-card__lead">
            Te enviaremos una solicitud a la app ZeroID de tu teléfono para que
            confirmes que eres tú.
          </p>
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              aria-label="Correo electrónico"
              autoFocus
            />
            <button type="submit" className="btn btn--primary">
              Continuar
            </button>
          </form>
          <p className="cta-status is-error" role="status" aria-live="polite">
            {message}
          </p>
          <div className="auth-divider">o</div>
          <button
            type="button"
            className="btn btn--secondary auth-guest"
            onClick={enterAsGuest}
          >
            Entrar como invitado
          </button>
        </div>
      ) : (
        <div className="auth-waiting">
          <div className="auth-card">
            <span className="pulse-dot" />
            <h1 className="auth-card__title">Revisa tu teléfono</h1>
            <p className="text-muted auth-card__lead">
              Enviamos una solicitud de inicio de sesión a la app ZeroID
              asociada a <strong>{email}</strong>.
            </p>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setStep("email")}
            >
              Usar otro correo
            </button>
          </div>

          <div className="phone" aria-label="Simulación de la app del teléfono">
            <span className="phone__label">Simulación · App ZeroID</span>
            <div className="phone__screen">
              <BrandLogo variant="mark" className="brand-logo--mark-lg" />
              <h2>¿Eres tú quien intenta iniciar sesión?</h2>
              <dl className="phone__meta">
                <dt>Sitio</dt>
                <dd>Dashboard ZeroID</dd>
                <dt>Dispositivo</dt>
                <dd>Navegador web</dd>
                <dt>Ubicación</dt>
                <dd>Caracas, VE</dd>
              </dl>
              <button type="button" className="btn btn--primary" onClick={approve}>
                Sí, soy yo
              </button>
              <button type="button" className="btn btn--secondary" onClick={reject}>
                No soy yo
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

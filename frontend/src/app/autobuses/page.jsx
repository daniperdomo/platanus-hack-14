"use client";

import { useEffect, useRef, useState } from "react";
import SignInButton from "@/components/zeroid/SignInButton";
import { DATA_FIELDS } from "@/lib/mockData";
import { cancelRequest, requestAuthorization, subscribe } from "@/lib/zeroidConnect";

const SESSION_KEY = "expreso.session";

const CLIENT = {
  id: "expreso-caribe",
  name: "Expreso Caribe",
  domain: "expresocaribe.com",
  color: "#1d4ed8",
  retention: "Boletos: 1 año tras el viaje. Contacto: hasta que cierres tu cuenta.",
};

const REQUIRED = [
  {
    field: "nombre",
    purpose: "Emitir tu boleto a tu nombre, como exige la ley de transporte terrestre.",
    retention: "1 año después del viaje (registro de pasajeros).",
  },
  {
    field: "documento",
    purpose: "Verificar tu identidad al abordar el autobús.",
    retention: "1 año después del viaje (registro de pasajeros).",
  },
  {
    field: "email",
    purpose: "Enviarte el boleto y el comprobante de pago.",
    retention: "Hasta que cierres tu cuenta.",
  },
];

const OPTIONAL = [
  {
    field: "telefono",
    purpose: "Avisarte por SMS de retrasos o cambios de andén.",
    retention: "Hasta que lo quites de tu cuenta.",
  },
  {
    field: "fecha_nacimiento",
    purpose: "Aplicar descuentos de estudiante o tercera edad.",
    retention: "Solo se usa para calcular el descuento; no se guarda.",
  },
  {
    field: "direccion",
    purpose: "Emitir factura fiscal a tu nombre.",
    retention: "5 años, por obligación tributaria.",
  },
];

const TRIPS = [
  { id: 1, from: "Caracas", to: "Valencia", time: "07:30", duration: "2 h 30 min", price: 12 },
  { id: 2, from: "Caracas", to: "Maracay", time: "09:00", duration: "1 h 45 min", price: 9 },
  { id: 3, from: "Caracas", to: "Barquisimeto", time: "13:15", duration: "5 h 10 min", price: 21 },
  { id: 4, from: "Caracas", to: "Puerto La Cruz", time: "22:00", duration: "5 h 00 min", price: 18 },
];

export default function AutobusesPage() {
  const [session, setSession] = useState(null);
  const [modal, setModal] = useState(null);
  const [reserved, setReserved] = useState([]);
  const pendingId = useRef(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw) setSession(JSON.parse(raw));

    return subscribe((message) => {
      if (message.type !== "response" || message.id !== pendingId.current) return;
      pendingId.current = null;
      if (!message.approved) {
        setModal("rejected");
        return;
      }
      const user = { data: message.data, at: new Date().toISOString() };
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      setSession(user);
      setModal(null);
    });
  }, []);

  function signInWithZeroId() {
    const request = requestAuthorization({
      client: CLIENT,
      required: REQUIRED,
      optional: OPTIONAL,
    });
    pendingId.current = request.id;
    setModal("waiting");
  }

  function closeModal() {
    if (pendingId.current) cancelRequest(pendingId.current);
    pendingId.current = null;
    setModal(null);
  }

  function logout() {
    window.localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setReserved([]);
  }

  function reserve(tripId) {
    if (!session) {
      setModal("login");
      return;
    }
    setReserved((current) => [...current, tripId]);
  }

  const firstName = session?.data.nombre?.split(" ")[0];

  return (
    <>
      <header className="bus-nav">
        <div className="container bus-nav__inner">
          <span className="bus-brand">
            <span className="bus-brand__mark">EC</span>
            Expreso Caribe
          </span>
          {session ? (
            <div className="bus-nav__user">
              <span className="bus-avatar">{firstName?.[0]}</span>
              <span>Hola, {firstName}</span>
              <button type="button" className="bus-btn bus-btn--ghost" onClick={logout}>
                Salir
              </button>
            </div>
          ) : (
            <button type="button" className="bus-btn" onClick={() => setModal("login")}>
              Iniciar sesión
            </button>
          )}
        </div>
      </header>

      <main>
        <section className="bus-hero">
          <div className="container">
            <h1>Viaja por Venezuela con un solo boleto digital.</h1>
            <p>Compra tu pasaje en segundos y aborda mostrando tu teléfono.</p>
            <form className="bus-search" onSubmit={(event) => event.preventDefault()}>
              <label>
                Origen
                <input defaultValue="Caracas" />
              </label>
              <label>
                Destino
                <input placeholder="¿A dónde vas?" />
              </label>
              <label>
                Fecha
                <input type="date" defaultValue="2026-10-30" />
              </label>
              <button type="submit" className="bus-btn">
                Buscar
              </button>
            </form>
          </div>
        </section>

        <section className="container bus-section">
          <h2>Salidas de hoy</h2>
          <ul className="bus-trips">
            {TRIPS.map((trip) => (
              <li className="bus-trip" key={trip.id}>
                <div>
                  <strong>
                    {trip.from} → {trip.to}
                  </strong>
                  <span>
                    {trip.time} · {trip.duration}
                  </span>
                </div>
                <span className="bus-trip__price">${trip.price}</span>
                {reserved.includes(trip.id) ? (
                  <span className="bus-trip__done">✓ Boleto enviado a tu correo</span>
                ) : (
                  <button type="button" className="bus-btn" onClick={() => reserve(trip.id)}>
                    Comprar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        {session && (
          <section className="container bus-section">
            <h2>Datos recibidos de ZeroID</h2>
            <p className="bus-muted">
              Esto es exactamente lo que Expreso Caribe recibió. Nada más.
            </p>
            <dl className="bus-received">
              {Object.entries(session.data).map(([field, value]) => (
                <div key={field}>
                  <dt>{DATA_FIELDS[field] ?? field}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </main>

      {modal && (
        <div className="bus-modal" role="dialog" aria-modal="true">
          <div className="bus-modal__card">
            <button type="button" className="bus-modal__close" onClick={closeModal} aria-label="Cerrar">
              ×
            </button>

            {modal === "login" && (
              <>
                <h2>Inicia sesión</h2>
                <p className="bus-muted">Para comprar pasajes necesitas una cuenta.</p>
                <SignInButton onClick={signInWithZeroId} />
                <div className="bus-divider">o</div>
                <input className="bus-input" placeholder="Correo electrónico" disabled />
                <input className="bus-input" placeholder="Contraseña" type="password" disabled />
                <button type="button" className="bus-btn bus-btn--block" disabled>
                  Entrar con contraseña
                </button>
              </>
            )}

            {modal === "waiting" && (
              <>
                <span className="bus-spinner" />
                <h2>Confirma en ZeroID</h2>
                <p className="bus-muted">
                  Abre la app ZeroID de tu teléfono o tu dashboard de ZeroID para
                  aprobar el inicio de sesión.
                </p>
                <div className="bus-modal__links">
                  <a href="/app" target="_blank" rel="noreferrer" className="bus-btn bus-btn--ghost">
                    Abrir app (simulación)
                  </a>
                  <a href="/dashboard" target="_blank" rel="noreferrer" className="bus-btn bus-btn--ghost">
                    Abrir dashboard
                  </a>
                </div>
              </>
            )}

            {modal === "rejected" && (
              <>
                <h2>Inicio de sesión cancelado</h2>
                <p className="bus-muted">
                  No autorizaste el acceso desde ZeroID. Puedes intentarlo de nuevo.
                </p>
                <SignInButton onClick={signInWithZeroId} />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

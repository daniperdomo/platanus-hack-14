"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import LivenessCapture from "@/components/LivenessCapture";

export default function BovedaPage() {
  return (
    <>
      <Nav />
      <main className="vault">
        <div className="container vault__layout">
          <header className="vault__intro">
            <span className="section-tag">Bóveda</span>
            <h1 className="vault__title">Prueba de vida en el borde</h1>
            <p className="vault__lead">
              MediaPipe Face Mesh corre en WebAssembly dentro de tu navegador.
              Te pedimos movimientos físicos; si los cumples, extraemos{" "}
              <strong>una sola foto</strong>. Ningún stream de video viaja al
              servidor.
            </p>
          </header>

          <section className="vault__card">
            <h2>Liveness activo</h2>
            <LivenessCapture />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

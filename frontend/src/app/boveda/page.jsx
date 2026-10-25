import Link from "next/link";
import VaultFlow from "@/components/VaultFlow";

export const metadata = {
  title: "Prueba de vida — ZeroID",
  description:
    "Comprueba que eres tú. La cámara no sale de este navegador.",
};

export default function BovedaPage() {
  return (
    <main className="flow">
      <div className="container flow__bar">
        <Link href="/" className="nav__brand">
          <span className="logo-mark" />
          ZeroID
        </Link>
        <Link href="/registrar" className="flow__back">
          ← Volver al pasaporte
        </Link>
      </div>
      <div className="container">
        <div className="register">
          <header className="register__intro">
            <span className="section-tag">Bóveda</span>
            <h1 className="section__title">Comprueba que eres tú.</h1>
            <p className="section__desc">
              La cámara se queda en este navegador. Te pedimos un gesto, sacamos
              una sola foto y apagamos el video. Ningún stream viaja al servidor.
            </p>
          </header>
          <section className="register__panel">
            <VaultFlow />
          </section>
        </div>
      </div>
    </main>
  );
}

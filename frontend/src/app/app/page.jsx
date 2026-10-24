"use client";

import Link from "next/link";
import ConsentPrompt from "@/components/zeroid/ConsentPrompt";
import usePendingRequest from "@/components/zeroid/usePendingRequest";

export default function PhoneAppPage() {
  const [request, answer] = usePendingRequest();

  return (
    <main className="auth">
      <Link href="/" className="nav__brand auth__brand">
        <span className="logo-mark" />
        ZeroID
      </Link>

      <div className="phone">
        <span className="phone__label">Simulación · App ZeroID</span>
        <div className="phone__screen phone__screen--app">
          {request ? (
            <ConsentPrompt key={request.id} request={request} onRespond={answer} />
          ) : (
            <div className="phone__idle">
              <span className="logo-mark" />
              <h2>La confirmación vive en la app</h2>
              <p className="text-muted">
                Escanea con la app ZeroID el código que muestra el sitio. Ahí
                confirmas que eres tú y eliges qué datos compartir.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

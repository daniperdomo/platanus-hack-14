"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import ConsentPrompt from "@/components/zeroid/ConsentPrompt";
import usePendingRequest from "@/components/zeroid/usePendingRequest";
import { profile } from "@/lib/mockData";

export default function PhoneAppPage() {
  const [request, answer] = usePendingRequest();

  if (request) {
    return (
      <main className="zero-app">
        <header className="zero-app__bar">
          <Link href="/" className="nav__brand" aria-label="ZeroID">
            <BrandLogo variant="lockup" />
          </Link>
        </header>
        <div className="zero-app__stage">
          <ConsentPrompt key={request.id} request={request} onRespond={answer} />
        </div>
      </main>
    );
  }

  return (
    <main className="auth">
      <Link href="/" className="nav__brand auth__brand" aria-label="ZeroID">
        <BrandLogo variant="lockup" />
      </Link>

      <div className="phone">
        <div className="phone__screen phone__screen--app">
          <div className="phone__idle">
            <BrandLogo variant="mark" className="brand-logo--mark-lg" />
            <h2>Hola, {profile.name.split(" ")[0]}</h2>
            <p className="text-muted">
              No tienes solicitudes pendientes. Cuando un sitio te pida iniciar
              sesión con ZeroID, aparecerá aquí.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav${scrolled ? " is-scrolled" : ""}`} id="nav">
      <div className="container nav__inner">
        <Link href="/" className="nav__brand">
          <span className="logo-mark" />
          ZeroID
        </Link>
        <nav className="nav__links">
          <a href="#problema">Problema</a>
          <a href="#solucion">Solución</a>
        </nav>
        <div className="nav__actions">
          <Link href="/registrar" className="btn btn--primary btn--sm">
            Registrarme
          </Link>
        </div>
      </div>
    </header>
  );
}

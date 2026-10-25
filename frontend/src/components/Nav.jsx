"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeSwitcher from "@/components/ThemeSwitcher";

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
          <a href="/#personas">Personas</a>
          <a href="/#empresas">Empresas</a>
          <a href="/#como-funciona">Cómo funciona</a>
          <Link href="/autobuses">Demo</Link>
        </nav>
        <div className="nav__actions">
          <ThemeSwitcher />
          <Link href="/login" className="btn btn--secondary btn--sm">
            Iniciar sesión
          </Link>
          <a href="/#cta" className="btn btn--primary btn--sm">
            Crear mi ZeroID
          </a>
        </div>
      </div>
    </header>
  );
}

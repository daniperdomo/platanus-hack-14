"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { DEMO_URL } from "@/lib/demo";

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
        <Link href="/" className="nav__brand" aria-label="ZeroID">
          <BrandLogo variant="lockup" />
        </Link>
        <nav className="nav__links">
          <a href="/#personas">Personas</a>
          <a href="/#empresas">Empresas</a>
          <a href="/#como-funciona">Cómo funciona</a>
          <a href={DEMO_URL}>Demo</a>
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

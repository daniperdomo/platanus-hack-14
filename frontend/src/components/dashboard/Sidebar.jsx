"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/sitios", label: "Sitios conectados" },
  { href: "/dashboard/actividad", label: "Actividad" },
  { href: "/dashboard/datos", label: "Mis datos" },
  { href: "/dashboard/dispositivos", label: "Dispositivos" },
];

export default function Sidebar({ username, onLogout }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link href="/" className="nav__brand sidebar__brand">
        <span className="logo-mark" />
        ZeroID
      </Link>

      <nav className="sidebar__nav">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`sidebar__link${pathname === link.href ? " is-active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar__footer">
        <span className="sidebar__email">{username}</span>
        <button type="button" className="btn btn--secondary btn--sm" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { useSession } from "./SessionContext";
import useVault from "./useVault";

export default function UserAvatar() {
  const session = useSession();
  const { profile } = useVault();
  const label = profile?.name || (session?.guest ? "Invitado" : session?.username) || "Perfil";
  const initial = (profile?.name || session?.username || "Z").charAt(0).toUpperCase();

  return (
    <Link
      href="/dashboard/perfil"
      className="user-avatar"
      aria-label={`Abrir perfil de ${label}`}
      title={label}
    >
      {initial}
    </Link>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/components/dashboard/SessionContext";
import useVault from "@/components/dashboard/useVault";
import { endSession } from "@/lib/session";

export default function ProfilePage() {
  const router = useRouter();
  const session = useSession();
  const { profile } = useVault();
  const name = profile?.name || (session?.guest ? "Invitado" : "Usuario");
  const email = session?.guest ? "Sesión de invitado" : session?.email;
  const initial = name.charAt(0).toUpperCase();

  function logout() {
    endSession();
    router.replace("/login");
  }

  return (
    <>
      <header className="page-header">
        <span className="section-tag">Cuenta</span>
        <h1 className="page-header__title">Perfil</h1>
        <p className="text-muted">Datos de la sesión actual. El backend los conectará después.</p>
      </header>

      <section className="panel profile-card">
        <div className="profile-card__head">
          <span className="user-avatar user-avatar--lg">{initial}</span>
          <div>
            <h2>{name}</h2>
            <p className="text-muted">{email}</p>
          </div>
        </div>

        <dl className="profile-card__meta">
          <div>
            <dt>ZeroID</dt>
            <dd>
              <code>{profile?.zeroId ?? "—"}</code>
            </dd>
          </div>
          <div>
            <dt>Verificado</dt>
            <dd>{profile?.verifiedAt ?? "Identidad sin verificar"}</dd>
          </div>
          <div>
            <dt>Sesión</dt>
            <dd>{session?.guest ? "Invitado" : "Verificada"}</dd>
          </div>
        </dl>

        <button type="button" className="btn btn--secondary" onClick={logout}>
          {session?.guest ? "Salir" : "Cerrar sesión"}
        </button>
      </section>
    </>
  );
}

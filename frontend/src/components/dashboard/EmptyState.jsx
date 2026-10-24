import Link from "next/link";

export default function EmptyState({ title, body }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p className="text-muted">{body}</p>
      <Link href="/registrar" className="btn btn--primary btn--sm">
        Verificar mi identidad
      </Link>
    </div>
  );
}

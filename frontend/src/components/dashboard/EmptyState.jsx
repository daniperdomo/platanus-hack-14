import Link from "next/link";

export default function EmptyState({ title, body, showAction = true }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p className="text-muted">{body}</p>
      {showAction && (
        <Link href="/registrar" className="btn btn--primary btn--sm">
          Verificar mi identidad
        </Link>
      )}
    </div>
  );
}

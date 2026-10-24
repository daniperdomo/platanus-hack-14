import Link from "next/link";
import DocumentCapture from "@/components/DocumentCapture";

export const metadata = {
  title: "Registro — ZeroID",
  description:
    "Fotografía tu pasaporte. ZeroID no se queda con la imagen.",
};

export default function RegistrarPage() {
  return (
    <main className="flow">
      <div className="container flow__bar">
        <Link href="/" className="nav__brand">
          <span className="logo-mark" />
          ZeroID
        </Link>
        <Link href="/" className="flow__back">
          ← Volver al inicio
        </Link>
      </div>
      <div className="container">
        <DocumentCapture />
      </div>
    </main>
  );
}

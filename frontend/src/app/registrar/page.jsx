import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import DocumentCapture from "@/components/DocumentCapture";

export const metadata = {
  title: "Registro — ZeroID",
  description:
    "Fotografía tu pasaporte. ZeroID no se queda con la imagen.",
};

export default function RegistrarPage() {
  return (
    <main className="flow">
      <div className="container">
        <header className="flow__bar">
          <Link href="/" className="nav__brand" aria-label="ZeroID">
            <BrandLogo variant="lockup" />
          </Link>
          <Link href="/" className="flow__back">
            ← Volver al inicio
          </Link>
        </header>
        <DocumentCapture />
      </div>
    </main>
  );
}

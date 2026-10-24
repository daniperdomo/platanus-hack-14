import Link from "next/link";
import DocumentCapture from "@/components/DocumentCapture";

export const metadata = {
  title: "Registro — ZeroID",
  description:
    "Fotografía tu cédula o pasaporte. ZeroID no se queda con la imagen.",
};

export default function RegistrarPage() {
  return (
    <>
      <Link href="/" className="back-link">
        ← Volver al inicio
      </Link>
      <main className="section">
        <div className="container">
          <DocumentCapture />
        </div>
      </main>
    </>
  );
}

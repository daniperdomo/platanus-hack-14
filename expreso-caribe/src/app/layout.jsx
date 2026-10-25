import "./globals.css";

export const metadata = {
  title: "Expreso Caribe — Pasajes de autobús",
  description: "Compra tu pasaje de autobús en segundos e inicia sesión con ZeroID.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bus">{children}</body>
    </html>
  );
}

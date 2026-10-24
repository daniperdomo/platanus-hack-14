import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
});

export const metadata = {
  title: "ZeroID — Tu identidad verificada, bajo tu control",
  description:
    "Verifícate una vez e inicia sesión en cualquier sitio aprobando desde tu teléfono qué datos compartes, para qué y por cuánto tiempo.",
};

export const viewport = {
  themeColor: "#0d0e11",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import FeatureSection from "@/components/FeatureSection";
import BusinessSection from "@/components/BusinessSection";
import HowItWorks from "@/components/HowItWorks";
import Comparison from "@/components/Comparison";
import Solution from "@/components/Solution";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";

const userBenefits = [
  {
    num: "01",
    title: "Verifícate una sola vez",
    body: "Olvídate de subir fotos de tu documento y selfies en cada sitio. Lo haces una vez con ZeroID y listo.",
  },
  {
    num: "02",
    title: "Tú apruebas cada acceso",
    body: "Nadie entra con tu identidad sin que lo confirmes desde tu teléfono. Si no fuiste tú, lo bloqueas al instante.",
  },
  {
    num: "03",
    title: "Sabes qué hacen con tus datos",
    body: "Cada sitio declara qué datos pide, para qué y por cuánto tiempo. Los opcionales los eliges tú, y revocas el acceso cuando quieras.",
  },
];

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <FeatureSection
          id="personas"
          tag="Para personas"
          title="Deja de entregar tu vida privada en cada registro."
          description="Hoy cada sitio te pide tu documento, tus fotos y tus datos, y nunca sabes qué hace con ellos. Con ZeroID tienes el control."
          cards={userBenefits}
        />
        <BusinessSection />
        <HowItWorks />
        <Comparison />
        <Waitlist />
      </main>
      <Footer />
    </>
  );
}

import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import FeatureSection from "@/components/FeatureSection";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";

const problems = [
  {
    num: "01",
    title: "Sobre-recolección abusiva",
    body: "Para comprobar que no eres un bot o que tienes más de 18 años, entregas nombre completo, dirección, RUT y fotos de tu carnet.",
  },
  {
    num: "02",
    title: "Confianza a ciegas",
    body: "Tus documentos se almacenan en servidores y proveedores externos cuya seguridad nunca puedes auditar ni controlar.",
  },
  {
    num: "03",
    title: "Riesgo permanente",
    body: "Una contraseña hackeada se cambia en un segundo. Tus fotos de identidad y tu RUT quedan expuestos en internet para siempre.",
  },
];

const solutions = [
  {
    num: "01",
    title: "Validación sin retención",
    body: "Tu cámara comprueba que eres real en tu navegador. Leemos tu carnet una sola vez y destruimos al instante todas las fotos y textos.",
  },
  {
    num: "02",
    title: "Custodia en tu dispositivo",
    body: "Tu credencial digital vive exclusivamente en tu navegador. Evitamos cuentas duplicadas o falsas sin saber quién eres.",
  },
  {
    num: "03",
    title: "Respuesta en un clic",
    body: "Para entrar a una web externa, tu dispositivo genera una prueba criptográfica que responde sí o no a la regla exigida.",
  },
];

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <FeatureSection
          id="problema"
          tag="El problema actual"
          title="Para entrar a un sitio, te exigen entregar tu vida privada."
          description="Cada vez que te registras, te obligan a subir fotos de tu carnet, selfies e información sensible que la plataforma no necesita para operar."
          cards={problems}
        />
        <FeatureSection
          id="solucion"
          tag="La solución"
          title="Verifica el atributo, nunca a la persona."
          description="Pruebas matemáticas que le demuestran al sitio web exactamente lo que necesita saber, sin que nadie guarde tus datos."
          cards={solutions}
          bordered
        />
        <Waitlist />
      </main>
      <Footer />
    </>
  );
}

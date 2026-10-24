const steps = [
  {
    title: "Verifícate una vez",
    body: "Escaneas tu documento y haces una prueba de vida. Tus datos quedan cifrados en tu bóveda ZeroID.",
  },
  {
    title: "Elige “Continuar con ZeroID”",
    body: "En cualquier sitio afiliado, sin crear contraseñas ni llenar formularios.",
  },
  {
    title: "Aprueba desde tu teléfono",
    body: "Confirmas que eres tú y ves qué datos pide el sitio, cuáles son opcionales y para qué los usará.",
  },
  {
    title: "Controla todo desde tu dashboard",
    body: "Ves cada sitio conectado, qué datos tiene y qué hace con ellos. Revocas el acceso con un clic.",
  },
];

export default function HowItWorks() {
  return (
    <section className="section section--bordered" id="como-funciona">
      <div className="container">
        <div className="section__header">
          <span className="section-tag">Cómo funciona</span>
          <h2 className="section__title">Cuatro pasos. Una sola verificación.</h2>
        </div>

        <ol className="steps">
          {steps.map((step, index) => (
            <li className="step" key={step.title}>
              <span className="step__num">{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

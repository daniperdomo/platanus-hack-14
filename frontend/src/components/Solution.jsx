export default function Solution({ tag, title, description, exposed, revealed, pillars }) {
  return (
    <section className="section section--bordered" id="solucion">
      <div className="container">
        <div className="section__header">
          <span className="section-tag">{tag}</span>
          <h2 className="section__title">{title}</h2>
          <p className="section__desc">{description}</p>
        </div>

        <div className="compare flex flex-col md:flex-row">
          <div className="compare__side">
            <span className="compare__label">Lo que entregas hoy</span>
            <ul className="compare__list compare__list--exposed">
              {exposed.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="compare__arrow" aria-hidden="true">→</div>

          <div className="compare__side compare__side--zeroid">
            <span className="compare__label">Lo que ve el sitio con ZeroID</span>
            <ul className="compare__list compare__list--revealed">
              {revealed.map((item) => (
                <li key={item}>
                  <code>{item}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul className="pillars">
          {pillars.map((pillar) => (
            <li key={pillar.title}>
              <strong>{pillar.title}.</strong> {pillar.body}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function FeatureSection({
  id,
  tag,
  title,
  description,
  cards,
  bordered = false,
}) {
  return (
    <section className={`section${bordered ? " section--bordered" : ""}`} id={id}>
      <div className="container">
        <div className="section__header">
          <span className="section-tag">{tag}</span>
          <h2 className="section__title">{title}</h2>
          <p className="section__desc">{description}</p>
        </div>

        <div className="cards-grid">
          {cards.map((card) => (
            <article className="feature-card" key={card.num}>
              <div className="feature-card__num">{card.num}</div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

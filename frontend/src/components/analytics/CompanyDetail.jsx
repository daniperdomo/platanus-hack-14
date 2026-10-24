import { DIMENSIONS, lastScan } from "@/lib/trustData";
import LevelBadge from "./LevelBadge";
import Trend from "./Trend";

export default function CompanyDetail({ company }) {
  return (
    <aside className="company-detail" aria-live="polite">
      <div className="company-detail__head">
        <span className="site-card__avatar">{company.name[0]}</span>
        <div>
          <h2>{company.name}</h2>
          <span className="text-muted">
            {company.domain} · {company.category}
          </span>
        </div>
      </div>

      <div className="company-detail__score">
        <span className="company-detail__hero">{company.score}</span>
        <div className="company-detail__score-meta">
          <LevelBadge score={company.score} />
          <span className="text-muted">
            Últimos 30 días: <Trend value={company.trend} />
          </span>
        </div>
      </div>

      <section>
        <h3 className="company-detail__title">Desglose</h3>
        <ul className="breakdown">
          {DIMENSIONS.map((dimension) => {
            const value = company.scores[dimension.key];
            return (
              <li key={dimension.key} title={dimension.description}>
                <div className="breakdown__label">
                  <span>{dimension.label}</span>
                  <span className="breakdown__value">{value}</span>
                </div>
                <span className="breakdown__track">
                  <span className="breakdown__fill" style={{ width: `${value}%` }} />
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h3 className="company-detail__title">Datos que recolecta</h3>
        <div className="field-tags">
          {company.collects.map((item) => (
            <span className="field-tag" key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h3 className="company-detail__title">Incidentes públicos</h3>
        {company.incidents.length > 0 ? (
          <ul className="incidents">
            {company.incidents.map((incident) => (
              <li key={incident.text}>
                <span className="incidents__year">{incident.year}</span>
                <span>{incident.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Sin incidentes públicos registrados.</p>
        )}
      </section>

      <p className="company-detail__foot">Última revisión del scraper: {lastScan}</p>
    </aside>
  );
}

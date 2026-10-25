import {
  DIMENSIONS,
  POLICY_CATEGORY_LABEL,
  POLICY_STATUS_LABEL,
  formatRetention,
  lastScan,
  levelFor,
} from "@/lib/trustData";
import Trend from "./Trend";

export default function CompanyDetail({ company }) {
  const level = levelFor(company.score);

  return (
    <aside className="company-detail" aria-live="polite">
      <header className="company-detail__head">
        <span className="site-card__avatar">{company.name[0]}</span>
        <div className="company-detail__identity">
          <h2>{company.name}</h2>
          <span className="text-muted">
            {company.domain} · {company.category}
          </span>
        </div>
        <div
          className={`company-detail__grade company-detail__grade--${level.tone}`}
          title={`${level.label} · ${company.score}/100`}
        >
          <span className="company-detail__grade-letter">{company.grade}</span>
          <span className="company-detail__grade-score">{company.score}/100</span>
        </div>
      </header>

      <div className="company-detail__crypto">
        <span className="crypto-tag">Firma {company.crypto.algorithm}</span>
        <span
          className={`crypto-tag${company.crypto.ephemeralProcessing ? " crypto-tag--on" : ""}`}
        >
          {company.crypto.ephemeralProcessing
            ? "Procesamiento efímero en RAM"
            : "Sin procesamiento efímero"}
        </span>
      </div>

      <section>
        <h3 className="company-detail__title">Políticas de datos</h3>
        <div className="policy-grid">
          {company.policies.map((policy) => (
            <article className="policy-card" key={policy.id}>
              <div className="policy-card__top">
                <span className="policy-card__category">
                  {POLICY_CATEGORY_LABEL[policy.category]}
                </span>
                <span className={`policy-chip policy-chip--${policy.status}`}>
                  {POLICY_STATUS_LABEL[policy.status]}
                </span>
              </div>
              <h4 className="policy-card__label">{policy.label}</h4>
              <p className="policy-card__reason">{policy.reason}</p>
              <dl className="policy-card__meta">
                <div>
                  <dt>Retención</dt>
                  <dd>{formatRetention(policy.retentionDays)}</dd>
                </div>
                <div>
                  <dt>Comparte con</dt>
                  <dd>{policy.sharedWith.length > 0 ? policy.sharedWith.join(", ") : "Nadie"}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <details className="scoring">
        <summary>Metodología de Scoring</summary>

        <div className="scoring__body">
          <p className="text-muted">
            Últimos 30 días: <Trend value={company.trend} />
          </p>

          <ul className="breakdown">
            {DIMENSIONS.map((dimension) => {
              const value = company.dimensions[dimension.key];
              return (
                <li key={dimension.key} title={dimension.description}>
                  <div className="breakdown__label">
                    <span>
                      {dimension.label} · {Math.round(dimension.weight * 100)}%
                    </span>
                    <span className="breakdown__value">{value}</span>
                  </div>
                  <span className="breakdown__track">
                    <span className="breakdown__fill" style={{ width: `${value}%` }} />
                  </span>
                </li>
              );
            })}
          </ul>

          <div>
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
          </div>
        </div>
      </details>

      <p className="company-detail__foot">Última revisión del scraper: {lastScan}</p>
    </aside>
  );
}

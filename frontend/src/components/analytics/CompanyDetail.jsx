"use client";

import { useState } from "react";
import { DIMENSIONS, lastScan, POLICY_STATUS_LABEL } from "@/lib/trustData";
import LevelBadge from "./LevelBadge";
import Trend from "./Trend";

const REQUIRED_COLOR = "#B42318";

export default function CompanyDetail({ company }) {
  const [scoringOpen, setScoringOpen] = useState(false);

  return (
    <aside className="company-detail" aria-live="polite">
      <header className="dossier-head">
        <div className="dossier-head__copy">
          <span className="dossier-head__overline">Dossier de Privacidad</span>
          <h2>{company.name}</h2>
          <span className="dossier-head__crypto">Firma {company.signatureAlgorithm}</span>
          <span className="text-muted">
            {company.domain} · {company.category}
          </span>
        </div>
        <div className={`dossier-grade${company.grade === "D" ? " is-critical" : ""}`}>
          <span className="dossier-grade__value">{company.grade}</span>
          <span className="dossier-grade__label">TRUST</span>
        </div>
      </header>

      <div className="dossier-grid">
        {company.policies.map((point) => (
          <article className="dossier-policy" key={`${point.category}-${point.label}`}>
            <span className="dossier-policy__category">{point.category}</span>
            <div className="dossier-policy__top">
              <strong>{point.label}</strong>
              <span
                className="dossier-policy__status"
                style={point.status === "required" ? { color: REQUIRED_COLOR } : undefined}
              >
                [ {POLICY_STATUS_LABEL[point.status]} ]
              </span>
            </div>
            <p className="dossier-policy__reason">{point.reason}</p>
            <p className="dossier-policy__retention">
              {point.retentionDays === 0
                ? "Retención: efímera · 0 días"
                : `Retención: ${point.retentionDays} días`}
            </p>
          </article>
        ))}
      </div>

      <div className="scoring-method">
        <button
          type="button"
          className="scoring-method__toggle"
          aria-expanded={scoringOpen}
          onClick={() => setScoringOpen((open) => !open)}
        >
          <span>Metodología de Scoring</span>
          <span className="scoring-method__chevron">{scoringOpen ? "−" : "+"}</span>
        </button>

        {scoringOpen ? (
          <div className="scoring-method__body">
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
              <h3 className="company-detail__title">Dimensiones</h3>
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
          </div>
        ) : null}
      </div>
    </aside>
  );
}

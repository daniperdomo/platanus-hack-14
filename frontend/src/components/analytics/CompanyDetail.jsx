"use client";

import { useEffect, useState } from "react";
import { DIMENSIONS, lastScan, POLICY_STATUS_LABEL } from "@/lib/trustData";
import LevelBadge from "./LevelBadge";
import Trend from "./Trend";

const REQUIRED_COLOR = "#B42318";

function barColor(value) {
  if (value >= 70) return "#10B981";
  if (value >= 50) return "#F59E0B";
  return "#EF4444";
}

function CompanyAvatar({ src, name }) {
  const [failed, setFailed] = useState(!src);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span className="dossier-avatar">
      {failed || !src ? (
        <span className="dossier-avatar__fallback">{initial}</span>
      ) : (
        <img src={src} alt={name} onError={() => setFailed(true)} />
      )}
    </span>
  );
}

export default function CompanyDetail({ company }) {
  const [scoringOpen, setScoringOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(company.grade !== "D");

  useEffect(() => {
    setLegalOpen(company.grade !== "D");
  }, [company.id, company.grade]);

  return (
    <aside className="company-detail" aria-live="polite">
      <header className="dossier-head">
        <CompanyAvatar key={company.id} src={company.logoUrl} name={company.name} />
        <div className="dossier-head__copy">
          <span className="dossier-head__overline">Dossier de Privacidad</span>
          <div className="dossier-head__title">
            <h2>{company.name}</h2>
            <div className={`dossier-grade${company.grade === "D" ? " is-critical" : ""}`}>
              <span className="dossier-grade__value">{company.grade}</span>
              <span className="dossier-grade__label">TRUST</span>
            </div>
          </div>
          <span className="dossier-head__crypto">Firma {company.signatureAlgorithm}</span>
          <span className="text-muted">
            {company.domain} · {company.category}
          </span>
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

      <section className="dossier-legal">
        <details
          key={company.id}
          className={`dossier-legal__panel${company.grade === "D" ? " is-critical" : ""}`}
          open={legalOpen}
          onToggle={(event) => setLegalOpen(event.currentTarget.open)}
        >
          <summary className="dossier-legal__summary">
            {company.grade === "D"
              ? "Prácticas de privacidad riesgosas. Toca para ver el desglose."
              : "Desglose Legal"}
          </summary>
          <ul className="breakdown">
            {DIMENSIONS.map((dimension) => {
              const value = company.scores[dimension.key];
              return (
                <li key={dimension.key}>
                  <div className="breakdown__label">
                    <span>{dimension.label}</span>
                    <span className="breakdown__value">{value}</span>
                  </div>
                  <span className="breakdown__track">
                    <span
                      className="breakdown__fill"
                      style={{ width: `${value}%`, background: barColor(value) }}
                    />
                  </span>
                  {company.justifications?.[dimension.key] ? (
                    <p className="breakdown__note">{company.justifications[dimension.key]}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </details>
      </section>

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
                        <span
                          className="breakdown__fill"
                          style={{ width: `${value}%`, background: barColor(value) }}
                        />
                      </span>
                      {company.justifications?.[dimension.key] ? (
                        <p className="breakdown__note">{company.justifications[dimension.key]}</p>
                      ) : null}
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

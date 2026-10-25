"use client";

import { useMemo, useState } from "react";
import CompanyDetail from "@/components/analytics/CompanyDetail";
import LevelBadge from "@/components/analytics/LevelBadge";
import ScoreMeter from "@/components/analytics/ScoreMeter";
import Trend from "@/components/analytics/Trend";
import {
  CATEGORIES,
  DIMENSIONS,
  LEVELS,
  lastScan,
  sourcesCount,
  trustCompanies,
} from "@/lib/trustData";

const SORTS = {
  "score-desc": { label: "Mayor puntaje", compare: (a, b) => b.score - a.score },
  "score-asc": { label: "Menor puntaje", compare: (a, b) => a.score - b.score },
  name: { label: "Nombre (A-Z)", compare: (a, b) => a.name.localeCompare(b.name) },
};

export default function AnalyticsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [sort, setSort] = useState("score-desc");
  const [selectedId, setSelectedId] = useState(trustCompanies[0].id);

  const ranked = useMemo(
    () => [...trustCompanies].sort(SORTS["score-desc"].compare).map((c, i) => ({ ...c, rank: i + 1 })),
    []
  );

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return ranked
      .filter((company) => category === "Todas" || company.category === category)
      .filter(
        (company) =>
          !text ||
          company.name.toLowerCase().includes(text) ||
          company.domain.includes(text)
      )
      .sort(SORTS[sort].compare);
  }, [ranked, query, category, sort]);

  const selected = ranked.find((company) => company.id === selectedId) ?? ranked[0];
  const average = Math.round(
    trustCompanies.reduce((total, company) => total + company.score, 0) / trustCompanies.length
  );
  const highRisk = trustCompanies.filter((company) => company.grade === "D").length;

  const stats = [
    { label: "Empresas analizadas", value: trustCompanies.length },
    { label: "Trust Score promedio", value: average },
    { label: "Empresas en alto riesgo", value: highRisk },
    { label: "Fuentes revisadas", value: sourcesCount.toLocaleString("es") },
  ];

  return (
    <>
      <header className="page-header">
        <span className="section-tag">Analytics</span>
        <h1 className="page-header__title">Trust Score de empresas</h1>
        <p className="text-muted">
          Qué tan bien tratan tus datos las empresas más conocidas, según sus
          políticas de privacidad, brechas de seguridad y sanciones públicas.
        </p>
      </header>

      <p className="demo-note">
        Trust Scores pre-calculados por el oráculo Gemini. Última
        revisión: {lastScan}.
      </p>

      <div className="stats stats--four">
        {stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <span className="stat__value">{stat.value}</span>
            <span className="stat__label">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="analytics-filters">
        <input
          type="search"
          className="analytics-search"
          placeholder="Buscar empresa o dominio"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar empresa"
        />
        <div className="chips" role="group" aria-label="Filtrar por categoría">
          {CATEGORIES.map((item) => (
            <button
              type="button"
              key={item}
              className={`chip${category === item ? " is-active" : ""}`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <select
          className="analytics-sort"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          aria-label="Ordenar"
        >
          {Object.entries(SORTS).map(([key, option]) => (
            <option key={key} value={key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="analytics-layout">
        <section className="panel analytics-ranking">
          {visible.length === 0 ? (
            <p className="text-muted analytics-empty">
              Ninguna empresa coincide con tu búsqueda.
            </p>
          ) : (
            <table className="ranking">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Empresa</th>
                  <th>Trust Score</th>
                  <th>Nivel</th>
                  <th>30 días</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((company) => (
                  <tr
                    key={company.id}
                    className={company.id === selected.id ? "is-selected" : ""}
                    onClick={() => setSelectedId(company.id)}
                  >
                    <td className="ranking__rank">{company.rank}</td>
                    <td>
                      <button
                        type="button"
                        className="ranking__company"
                        onClick={() => setSelectedId(company.id)}
                      >
                        <strong>{company.name}</strong>
                        <span>{company.category}</span>
                      </button>
                    </td>
                    <td>
                      <ScoreMeter score={company.score} />
                    </td>
                    <td>
                      <LevelBadge score={company.score} compact />
                    </td>
                    <td>
                      <Trend value={company.trend} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <CompanyDetail company={selected} />
      </div>

      <section className="panel methodology">
        <h2>Cómo calculamos el Trust Score</h2>
        <p className="text-muted">
          El scraper revisa políticas de privacidad, registros de brechas y
          sanciones de autoridades de protección de datos. Cada dimensión va de 0
          a 100 y se pondera así:
        </p>
        <ul className="methodology__list">
          {DIMENSIONS.map((dimension) => (
            <li key={dimension.key}>
              <strong>
                {dimension.label} · {Math.round(dimension.weight * 100)}%
              </strong>
              <span className="text-muted">{dimension.description}</span>
            </li>
          ))}
        </ul>
        <div className="methodology__levels">
          {LEVELS.map((level) => (
            <span key={level.grade} className="methodology__level">
              <LevelBadge score={level.min} />
              <span className="text-muted">
                {level.min === 0 ? "menos de 50" : `${level.min} o más`}
              </span>
            </span>
          ))}
        </div>
      </section>
    </>
  );
}

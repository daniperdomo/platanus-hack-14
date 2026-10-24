import { levelFor } from "@/lib/trustData";

export default function ScoreMeter({ score }) {
  const level = levelFor(score);
  return (
    <div className="score-meter" title={`Trust Score ${score}/100 · ${level.label}`}>
      <span className="score-meter__value">{score}</span>
      <span
        className={`score-meter__track score-meter__track--${level.tone}`}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-label={`Trust Score ${score} de 100`}
      >
        <span className="score-meter__fill" style={{ width: `${score}%` }} />
      </span>
    </div>
  );
}

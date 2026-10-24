import { levelFor } from "@/lib/trustData";

export default function LevelBadge({ score, compact = false }) {
  const level = levelFor(score);
  return (
    <span
      className={`level-badge level-badge--${level.tone}`}
      title={compact ? level.label : undefined}
    >
      <span className="level-badge__icon" aria-hidden="true">
        {level.icon}
      </span>
      {compact ? level.grade : `${level.grade} · ${level.label}`}
    </span>
  );
}

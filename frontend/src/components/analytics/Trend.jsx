export default function Trend({ value }) {
  if (value === 0) return <span className="trend">= 0</span>;
  const up = value > 0;
  return (
    <span className={`trend ${up ? "trend--up" : "trend--down"}`}>
      {up ? "▲" : "▼"} {Math.abs(value)}
    </span>
  );
}

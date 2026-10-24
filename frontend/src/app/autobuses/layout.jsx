import "./autobuses.css";

export const metadata = {
  title: "Expreso Caribe — Pasajes de autobús",
  description: "Demo de un sitio cliente que inicia sesión con ZeroID.",
};

export default function AutobusesLayout({ children }) {
  return <div className="bus">{children}</div>;
}

const columns = ["Login social", "KYC tradicional", "ZeroID"];

const rows = [
  { feature: "Inicio de sesión en un clic", values: [true, false, true] },
  { feature: "Identidad real verificada", values: [false, true, true] },
  { feature: "Propósito y retención por cada dato", values: [false, false, true] },
  { feature: "Apruebas cada acceso desde tu teléfono", values: [false, false, true] },
  { feature: "Historial de quién tiene tus datos", values: [false, false, true] },
  { feature: "Revocas el acceso cuando quieras", values: [true, false, true] },
];

export default function Comparison() {
  return (
    <section className="section section--bordered" id="comparacion">
      <div className="container">
        <div className="section__header">
          <span className="section-tag">Por qué ZeroID</span>
          <h2 className="section__title">
            Lo mejor del login social y del KYC, con transparencia total.
          </h2>
        </div>

        <div className="comparison">
          <table>
            <thead>
              <tr>
                <th />
                {columns.map((column) => (
                  <th key={column} className={column === "ZeroID" ? "is-highlight" : ""}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  {row.values.map((value, index) => (
                    <td
                      key={columns[index]}
                      className={columns[index] === "ZeroID" ? "is-highlight" : ""}
                    >
                      {value ? "✓" : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

import { devices } from "@/lib/mockData";

export default function DevicesPage() {
  return (
    <>
      <header className="page-header">
        <span className="section-tag">Seguridad</span>
        <h1 className="page-header__title">Dispositivos</h1>
        <p className="text-muted">
          El teléfono con la app ZeroID es el que aprueba cada inicio de sesión.
        </p>
      </header>

      <section className="panel">
        <ul className="devices">
          {devices.map((device) => (
            <li className="devices__item" key={device.id}>
              <div>
                <strong>{device.name}</strong>
                <span className="text-muted">{device.role}</span>
              </div>
              <span className={`badge${device.current ? "" : " badge--muted"}`}>
                {device.current ? "Este dispositivo" : device.lastSeen}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

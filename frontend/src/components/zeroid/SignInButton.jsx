// Botón oficial "Continuar con ZeroID" para sitios cliente, al estilo de Google Sign-In.
export default function SignInButton({ onClick, disabled = false }) {
  return (
    <button
      type="button"
      className="zeroid-signin"
      onClick={onClick}
      disabled={disabled}
    >
      <img src="/logo-mark.png" alt="" className="brand-logo brand-logo--mark zeroid-signin__logo" />
      <span>Continuar con ZeroID</span>
    </button>
  );
}

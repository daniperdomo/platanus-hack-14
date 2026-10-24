// Botón oficial "Continuar con ZeroID" para sitios cliente, al estilo de Google Sign-In.
export default function SignInButton({ onClick, disabled = false }) {
  return (
    <button
      type="button"
      className="zeroid-signin"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="zeroid-signin__logo" aria-hidden="true" />
      <span>Continuar con ZeroID</span>
    </button>
  );
}

// Botón oficial "Continuar con ZeroID", al estilo de Google Sign-In.
export default function SignInButton({ onClick, disabled = false }) {
  return (
    <button type="button" className="zeroid-signin" onClick={onClick} disabled={disabled}>
      <img src="/zeroid-mark.png" alt="" className="zeroid-signin__logo" />
      <span>Continuar con ZeroID</span>
    </button>
  );
}

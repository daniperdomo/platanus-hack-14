import BrandLogo from "@/components/BrandLogo";

export default function ZeroLoader({ label = "Procesando…" }) {
  return (
    <div className="zero-loader" role="status" aria-live="polite" aria-label={label}>
      <BrandLogo variant="mark" className="zero-loader__mark" />
    </div>
  );
}

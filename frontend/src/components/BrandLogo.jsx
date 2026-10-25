export default function BrandLogo({ variant = "lockup", className = "" }) {
  const classes = ["brand-logo", `brand-logo--${variant}`, className].filter(Boolean).join(" ");

  if (variant === "mark") {
    return <img src="/logo-mark.png" alt="" className={classes} />;
  }

  if (variant === "lockup") {
    return (
      <span className={classes}>
        <img src="/logo-mark.png" alt="" className="brand-logo__mark" />
        <img src="/logo-wordmark.png" alt="ZeroID" className="brand-logo__wordmark" />
      </span>
    );
  }

  return <img src="/logo-wordmark.png" alt="ZeroID" className={classes} />;
}

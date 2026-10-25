import BrandLogo from "@/components/BrandLogo";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner flex flex-col md:flex-row">
        <div className="footer__brand">
          <BrandLogo variant="lockup" />
          <span className="footer__copy">© 2026 ZeroID</span>
        </div>
        <span className="footer__tagline">Identidad privada y soberana</span>
      </div>
    </footer>
  );
}

import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";

export default function PrivacyPolicy() {
  const appUrl =
    import.meta.env.VITE_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "https://walpay.example");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "WalPay Privacy Policy",
    url: `${appUrl.replace(/\/$/, "")}/privacy`,
    description:
      "WalPay privacy policy describing data collection, usage, and retention practices for Flow payment merchants.",
    isPartOf: {
      "@type": "WebSite",
      url: appUrl,
      name: "WalPay",
    },
  };

  return (
    <>
      <Seo
        title="Privacy Policy"
        description="Understand how WalPay stores merchant data, handles OTP authentication, and secures Flow wallet interactions."
        structuredData={structuredData}
        keywords={[
          "WalPay privacy",
          "Flow payment privacy",
          "crypto data protection",
          "merchant data policy",
        ]}
        canonical={`${appUrl.replace(/\/$/, "")}/privacy`}
      />
      <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/80">WalPay</p>
          <h1 className="text-3xl font-semibold text-white">Privacy Policy</h1>
          <p className="text-sm text-slate-400">Last updated: October 2025</p>
        </header>

        <section className="space-y-6 text-sm leading-relaxed text-slate-300">
          <p>
            WalPay stores merchant account details (email, business profile, Flow wallet address) to operate your
            workspace. Payment link metadata is persisted in our database, while payment execution happens entirely on the
            Flow blockchain.
          </p>
          <p>
            We never store private keys or wallet secrets. OTP and password information is encrypted and only used for
            authentication flows. Analytics data is aggregated to improve the platform; you can request deletion of your
            workspace at any time via the profile settings.
          </p>
          <p>
            For questions or data requests, reach the WalPay team via the email channel provided during onboarding.
          </p>
        </section>

        <footer>
          <Link to="/" className="text-sm font-semibold text-emerald-300 hover:text-emerald-200">Return to WalPay</Link>
        </footer>
      </div>
      </div>
    </>
  );
}

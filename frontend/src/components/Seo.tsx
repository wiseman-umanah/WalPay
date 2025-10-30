import { Helmet } from "react-helmet-async";

type StructuredData = Record<string, unknown> | Array<Record<string, unknown>>;

type SeoProps = {
  title?: string;
  description?: string;
  image?: string | null;
  canonical?: string;
  noIndex?: boolean;
  structuredData?: StructuredData;
  keywords?: string[];
};

const DEFAULT_TITLE = "WalPay | Flow-native payment links for instant settlement";
const DEFAULT_DESCRIPTION =
  "WalPay helps Flow merchants launch payment links in minutes, route platform fees automatically, and track earnings with a real-time dashboard.";
const FALLBACK_IMAGE = "/logo.png";
const DEFAULT_KEYWORDS = [
  "Flow blockchain payments",
  "payment links",
  "crypto checkout",
  "WalPay platform",
  "FlowToken",
  "Cadence smart contract",
];

export function Seo({
  title,
  description,
  image,
  canonical,
  noIndex = false,
  structuredData,
  keywords,
}: SeoProps) {
  const baseUrl =
    import.meta.env.VITE_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "https://walpay.example");
  const canonicalUrl =
    canonical ??
    (typeof window !== "undefined" ? window.location.href : `${baseUrl}${typeof window !== "undefined" ? window.location.pathname : ""}`);

  const finalTitle = title ? `${title} | WalPay` : DEFAULT_TITLE;
  const finalDescription = description ?? DEFAULT_DESCRIPTION;
  const ogImage = image ?? `${baseUrl.replace(/\/$/, "")}${FALLBACK_IMAGE}`;
  const resolvedKeywords = keywords?.length ? keywords.join(", ") : DEFAULT_KEYWORDS.join(", ");

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={resolvedKeywords} />
      <meta name="theme-color" content="#0f172a" />
      <meta name="application-name" content="WalPay" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="WalPay" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content="WalPay logo" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@WalPay" />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="preconnect" href="https://access-testnet.onflow.org" />
      <link rel="preconnect" href="https://api.onflow.org" />
      <link rel="preconnect" href="https://res.cloudinary.com" />
      {noIndex ? (
        <>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="googlebot" content="noindex, nofollow" />
        </>
      ) : (
        <>
          <meta name="robots" content="index, follow" />
          <meta name="googlebot" content="index, follow" />
        </>
      )}
      {structuredData
        ? Array.isArray(structuredData)
          ? structuredData.map((schema, index) => (
              <script key={index} type="application/ld+json">
                {JSON.stringify(schema)}
              </script>
            ))
          : (
              <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
            )
        : null}
    </Helmet>
  );
}

import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
}

const SITE_URL = "https://dyarre.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

export function SEO({ title, description, path = "", image, type = "website", jsonLd }: SEOProps) {
  const fullTitle = title === "Home" ? "Dyarre — Premium Real Rstate Agency" : `${title} | dyarre`;
  const url = `${SITE_URL}${path}`;
  const ogImage = image || DEFAULT_IMAGE;

  const defaultJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "dyarre",
    url: SITE_URL,
    description: "Premium real estate brokerage in the UAE specializing in Lands, luxury villas, apartments, and off-plan investments.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Abu Dhabi",
      addressCountry: "AE",
    },
    telephone: "+971544444518",
    email: "dyarree@gmail.com",
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="dyarre" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      <script type="application/ld+json">
        {JSON.stringify(jsonLd || defaultJsonLd)}
      </script>
    </Helmet>
  );
}

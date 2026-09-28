const siteUrl = "https://hoantien-sale.vercel.app";

export default function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Hoàn Tiền Sale",
    url: siteUrl,
    logo: `${siteUrl}/platforms/hoantiensale.png`,
    description:
      "Hoàn Tiền Sale hỗ trợ người dùng tạo link mua sắm hoàn tiền trên Shopee, Lazada và TikTok Shop.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@hoantiensale.com",
      contactType: "customer support",
      availableLanguage: ["Vietnamese"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
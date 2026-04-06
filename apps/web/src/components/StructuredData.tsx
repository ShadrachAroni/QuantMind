import React from 'react';

export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://quantmind.co.ke/#organization",
        "name": "QuantMind",
        "url": "https://quantmind.co.ke",
        "logo": "https://quantmind.co.ke/logo.png",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+254-746-741-690",
          "contactType": "customer support",
          "email": "support@quantmind.co.ke"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://quantmind.co.ke/#webapp",
        "name": "QuantMind Portfolio Risk Modeling",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Any",
        "url": "https://quantmind.co.ke",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

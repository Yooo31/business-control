export const fixtureUrlByPlatform = {
  apple: "https://maps.apple.com/place?name=Business%20Control",
  google: "https://www.google.com/maps/place/Business+Control",
  yelp: "https://www.yelp.com/biz/business-control",
} as const;

export const sampleListingHtml = `
<!doctype html>
<html>
  <head>
    <title>Business Control</title>
    <meta property="og:title" content="Business Control" />
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Business Control",
        "telephone": "+33 6 12 34 56 78",
        "email": "contact@businesscontrol.fr",
        "url": "https://businesscontrol.fr/",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "10 Rue de Paris",
          "postalCode": "75001",
          "addressLocality": "Paris",
          "addressCountry": "FR"
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Monday",
            "opens": "09:00",
            "closes": "18:00"
          }
        ]
      }
    </script>
  </head>
  <body>
    <address>10 Rue de Paris 75001 Paris</address>
    <a href="tel:+33612345678">Call</a>
  </body>
</html>
`;

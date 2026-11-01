function numeric(value) {
  if (value === undefined || value === null || value === "") return null;
  const n =
    typeof value === "number"
      ? value
      : Number(String(value).replaceAll(",", ""));
  return Number.isFinite(n) && n >= 0 && n <= 1e12 ? n : null;
}
export function extractProducts(html) {
  if (typeof html !== "string" || !html.trim() || html.length > 3 * 1024 * 1024)
    throw Error("Provide saved HTML up to 3 MiB.");
  const scripts = [
    ...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi),
  ].filter((m) => /\btype\s*=\s*["']application\/ld\+json["']/i.test(m[1]));
  if (scripts.length > 100) throw Error("Too many structured-data blocks.");
  const products = [];
  let invalidBlocks = 0,
    visited = 0;
  function visit(item, depth = 0) {
    if (depth > 20 || ++visited > 20000)
      throw Error("Structured data exceeds supported complexity.");
    if (Array.isArray(item)) {
      item.forEach((x) => visit(x, depth + 1));
      return;
    }
    if (!item || typeof item !== "object") return;
    const types = Array.isArray(item["@type"])
      ? item["@type"]
      : [item["@type"]];
    if (
      types.some((t) => t === "Product" || t === "https://schema.org/Product")
    ) {
      const offer = Array.isArray(item.offers)
          ? item.offers[0]
          : item.offers || {},
        rating = item.aggregateRating || {};
      products.push({
        name: String(item.name || "Untitled").slice(0, 1000),
        sku: String(item.sku || "").slice(0, 200),
        brand: String(item.brand?.name || item.brand || "").slice(0, 200),
        price: numeric(offer.price ?? offer.lowPrice),
        currency: String(offer.priceCurrency || "").slice(0, 10),
        availability: String(offer.availability || "").slice(0, 200),
        rating: numeric(rating.ratingValue),
        ratingCount: numeric(rating.ratingCount ?? rating.reviewCount),
        description: String(item.description || "").slice(0, 4000),
      });
    }
    for (const [key, value] of Object.entries(item))
      if (
        value &&
        typeof value === "object" &&
        key !== "offers" &&
        key !== "aggregateRating"
      )
        visit(value, depth + 1);
  }
  for (const script of scripts) {
    let json;
    try {
      json = JSON.parse(script[2].trim());
    } catch {
      invalidBlocks++;
      continue;
    }
    visit(json);
  }
  if (products.length > 100) throw Error("Use a page with up to 100 products.");
  return { products, invalidBlocks, blocks: scripts.length };
}
export const DEMO =
  '<html><head><script type="application/ld+json">' +
  JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Fictional Study Headphones",
    sku: "DEMO-01",
    brand: { name: "Example Brand" },
    offers: {
      "@type": "Offer",
      price: "1299.00",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: { ratingValue: "4.2", ratingCount: "120" },
  }) +
  "</script></head><body>Synthetic example only.</body></html>";

import test from "node:test";
import assert from "node:assert/strict";
import { extractProducts, DEMO } from "../site/engine.js";
test("synthetic product fields are extracted with numeric prices", () => {
  const r = extractProducts(DEMO);
  assert.equal(r.products[0].price, 1299);
  assert.equal(r.products[0].currency, "INR");
  assert.equal(r.products[0].rating, 4.2);
});
test("graphs arrays and aggregate offers are supported", () => {
  const html =
    '<script type="application/ld+json">' +
    JSON.stringify({
      "@graph": [
        {
          "@type": ["Thing", "Product"],
          name: "A",
          offers: { lowPrice: 42, priceCurrency: "USD" },
        },
      ],
    }) +
    "</script>";
  assert.equal(extractProducts(html).products[0].price, 42);
});
test("invalid blocks are counted, executable scripts ignored", () => {
  const r = extractProducts(
    '<script>alert(1)</script><script type="application/ld+json">invalid</script>',
  );
  assert.equal(r.invalidBlocks, 1);
  assert.deepEqual(r.products, []);
});
test("missing and malformed prices stay unknown", () => {
  const r = extractProducts(
    '<script type="application/ld+json">{"@type":"Product","offers":{"price":"bad"}}</script>',
  );
  assert.equal(r.products[0].price, null);
  assert.equal(r.products[0].rating, null);
});
test("size and complexity are bounded", () => {
  assert.throws(() => extractProducts("x".repeat(3 * 1024 * 1024 + 1)));
  let o = {};
  for (let i = 0; i < 25; i++) o = { child: o };
  assert.throws(() =>
    extractProducts(
      '<script type="application/ld+json">' + JSON.stringify(o) + "</script>",
    ),
  );
});

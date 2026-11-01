import { extractProducts, DEMO } from "./engine.js";
import { $, announce, csv, download, readText } from "./ui.js";
let products = [];
function run() {
  try {
    const result = extractProducts($("html").value);
    products = result.products;
    $("results").replaceChildren();
    for (const row of products) {
      const section = document.createElement("section"),
        h = document.createElement("h3"),
        pre = document.createElement("pre");
      h.textContent = row.name;
      pre.textContent = JSON.stringify(row, null, 2);
      section.append(h, pre);
      $("results").append(section);
    }
    $("json").disabled = $("csv").disabled = !products.length;
    announce(
      `${products.length} Product objects · ${result.blocks} JSON-LD blocks · ${result.invalidBlocks} invalid blocks skipped. Missing values remain null/empty. No page code was executed.`,
    );
  } catch (error) {
    products = [];
    $("json").disabled = $("csv").disabled = true;
    announce(error.message);
  }
}
$("example").addEventListener("click", () => {
  $("html").value = DEMO;
  run();
});
$("extract").addEventListener("click", run);
$("file").addEventListener("change", async (e) => {
  try {
    $("html").value = await readText(e.target.files[0], 3 * 1024 * 1024);
    run();
  } catch (error) {
    announce(error.message);
  }
});
$("json").addEventListener("click", () =>
  download(
    "product-data.json",
    JSON.stringify(products, null, 2),
    "application/json",
  ),
);
$("csv").addEventListener("click", () => {
  if (products.length) {
    const headers = Object.keys(products[0]);
    download(
      "product-data.csv",
      csv([headers, ...products.map((r) => headers.map((k) => r[k]))]),
      "text/csv",
    );
  }
});
$("html").value = DEMO;
run();

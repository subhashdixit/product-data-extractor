# Product Data Extractor

**Reproducible versions:** [Dependency versions and exact setup](DEPENDENCIES.md).


[Open the application](https://subhashdixit.github.io/product-data-extractor/) · [Report an issue](https://github.com/subhashdixit/product-data-extractor/issues)

The original Flipkart-specific live scraper depended on fragile selectors and upstream access. This maintained app turns a user-authorized saved product page into inspectable structured data locally.

## What the finished application does

- Paste or import saved HTML containing schema.org Product JSON-LD.
- Extract title, SKU, brand, offer price/currency, availability and aggregate ratings.
- Report malformed JSON-LD blocks, retain missing values and export JSON/CSV.
- Start with a clearly fictional product fixture.

## Use the application step by step

1. Open the live application. Read the input labels and scope panel.
2. Start with the included example to understand the output.
3. Replace it with your own supported input. Files are processed locally unless you explicitly choose a server feature and consent to it.
4. Run the analysis and inspect the visual output together with its limitations.
5. Export your results when the tool offers a download. Keep your own copy; a browser tab is not a durable data store.

## Concepts, algorithms and interpretation

### Why structured data?

Many product pages include JSON-LD for search engines. It is more explicit than visual CSS selectors: a price field has semantic meaning independent of where it appears. The extractor reads only application/ld+json blocks, walks arrays/@graph and Product objects, and normalizes bounded numeric fields. It never executes imported scripts or appends imported HTML to the page. A malformed block is counted rather than silently treated as a zero-price product.

AggregateOffer lowPrice is used when a direct price is absent; this means the lowest listed offer, not a guaranteed checkout price. Arrays of offers use the first listed offer, which may not be the best or current one. Ratings/counts are source declarations, not independently verified review quality. A valid parse confirms syntax and mapping, not truth.

## Architecture and data flow

```mermaid
flowchart LR
  Input[Validated example or user input] --> Logic[Browser JavaScript engine]
  Logic --> Charts[Accessible results and SVG charts]
  Logic --> Export[Local downloadable results]
  Git[Versioned main branch] --> CI[Formatting, lint and behavior tests]
  CI --> Pages[Publish site only to GitHub Pages]
```

HTML provides the accessible page structure, CSS handles responsive layout, and ES modules separate calculation from user interaction. Pure calculation functions can run in Node tests without a browser. SVG charts scale with the screen; they use explicit axes, labels and legends. CSV exports escape spreadsheet formula prefixes in text cells.



## Run locally from scratch

Install Node.js 22 and Python 3 for a local static HTTP server. Python is not a production backend for this app.

```bash
git clone https://github.com/subhashdixit/product-data-extractor.git
cd product-data-extractor
npm ci
npm test
npm run lint
npm run format
npm run check
python3 -m http.server 8000 --directory site
```

Open http://localhost:8000. Use HTTP rather than double-clicking HTML so that module imports and local data fetches work consistently. No production API secret belongs in `site/`.

## Coding structure

```text
site/
  index.html       # accessible application interface
  styles.css       # responsive design
  app.js           # interface orchestration
  engine.js        # validated calculations; no DOM dependency
  ui.js            # chart, CSV and download helpers
tests/             # behavior and boundary cases
.github/workflows/pages.yml
archive/           # original README and retired workflows where present
```

Original source files, notebooks and historical artifacts remain in the repository for comparison. The release publishes only `site/`; old source directories and datasets are not automatically exposed by the application.

## CI/CD and deployment

CI means continuous integration: each pull request and main-branch push installs exact lockfile dependencies, checks formatting, lints JavaScript, runs meaningful behavior tests and checks module syntax. A failed check stops publishing. CD means continuous deployment: after the required `Build and test` check succeeds on `main`, GitHub Actions uploads `site/` and GitHub Pages serves it over HTTPS.

The workflow uses pinned action revisions, minimal permissions and a protected main branch. Publishing jobs need Pages/OIDC permissions; test jobs only read source. Feature branches are deleted after merge. Static Pages hosting needs no always-running Python process, but cannot hide secrets, host a Flask process or provide durable server storage.

To set up a fork, enable GitHub Pages with **GitHub Actions** as its source and allow the repository's workflow to run. Repository Settings → Pages shows the deployment URL. If renaming the repository, update the README URL and any absolute links; application resources use relative paths. Check Actions logs if publishing fails.

### Release, monitoring and rollback

A commit identifies exactly which source was deployed. Inspect the Actions deployment and test results before sharing the link. After publishing, open the page, run its example and check exports; a successful HTTP response alone is not a functional test. For rollback, revert the faulty merge in a new PR, pass checks, and merge the revert. This triggers the same reproducible publishing process. Avoid force-pushing protected main or deleting history. Browser caches can retain an older asset briefly; refresh after a deployment.

### Docker and alternatives

Docker packages code and dependencies into a reproducible runtime. This static app does not require a container: Pages serves the same versioned files directly, with less operating work and no container cold starts. A container becomes useful if adding a Python backend; then secrets, patches, resource costs and persistent storage require separate management.

## Data provenance and attribution

Original Flipkart_Scrapper files and historical CSVs are preserved outside the published site. Default HTML describes a fictional product. JSON-LD vocabulary: [schema.org Product](https://schema.org/Product), [Offer](https://schema.org/Offer) and [AggregateRating](https://schema.org/AggregateRating).

## Practical limits

This is an authorized saved-page/import workflow, not a live Flipkart crawler. No anti-bot challenge bypass, account scraping, automatic review harvesting or current-price promise. Some sites omit JSON-LD or render it only after client execution; such input produces no Product objects. Up to 3 MiB, 100 blocks/products, depth20 and 20,000 visited nodes. Exported data can be stale.

The test suite checks calculation contracts and invalid inputs. It cannot establish that an input dataset is representative, that a heuristic is scientifically correct for every domain, or that a result is suitable for an automated consequential decision. Read the original source alongside the maintained browser implementation when comparing behavior.

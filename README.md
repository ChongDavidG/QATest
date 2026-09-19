# Liverpool QA Automation Challenge

Playwright + TypeScript solution for the Liverpool e-commerce automation challenge.

## What It Covers

- Opens Liverpool and searches for `playstation 5`.
- Filters by color `White` / `Blanco`.
- Sorts by price from lowest to highest.
- Extracts and logs the first 5 product names and prices.
- Intercepts frontend network responses and validates that at least 3 of the 5 UI products are present in service data.
- Produces a Playwright HTML report.
- Captures screenshots, traces, and videos on failure through Playwright configuration.
- Includes a GitHub Actions workflow at `.github/workflows/test.yml`.
- Includes a one-page strategy document in `TEST_STRATEGY.md`.

## Requirements

- Node.js 22 or newer.
- npm.

## Install

```bash
npm install
npx playwright install chromium
```

## Run Headless

```bash
npm test
```

If the Playwright browser download is unavailable locally but Google Chrome is installed, run:

```bash
PW_CHANNEL=chrome npm test
```

## Run Headed

Either command works:

```bash
npm run test:headed
```

```bash
HEADED=1 npm test
```

## Open The HTML Report

```bash
npm run test:report
```

## Configuration

The defaults match the challenge, but the test is data-driven:

| Variable | Default | Purpose |
| --- | --- | --- |
| `BASE_URL` | `https://www.liverpool.com.mx/tienda/home` | Liverpool entry page |
| `SEARCH_TERM` | `playstation 5` | Product search term |
| `PRODUCT_COLOR` | `White` | Color filter, also matches `Blanco` |
| `MAX_PRODUCTS` | `5` | Number of UI results to extract |
| `MIN_NETWORK_MATCHES` | `3` | Minimum required UI/service matches |
| `MAX_RESULTS_LOAD_MS` | `15000` | Performance threshold |

Example:

```bash
SEARCH_TERM="nintendo switch" PRODUCT_COLOR="White" npm test
```

## CI

The GitHub Actions workflow installs dependencies, installs Chromium, runs the tests headlessly, and uploads `playwright-report` as an artifact.

After pushing this repository publicly, add either a passing workflow link or a badge here.

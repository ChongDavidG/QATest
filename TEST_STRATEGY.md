# Test Strategy

## Scope

This suite automates the critical customer path for Liverpool search discovery: open the site, search for a product, apply a color filter, sort by lowest price, extract the first five visible products, and validate those products against frontend network data. I kept the framework intentionally small: one page object for UI behavior, one service-data extractor, and shared product normalization utilities.

## What I Would Not Automate

I would not automate checkout, payment, login, third-party tracking, ads, recommendations, or inventory guarantees in this public-flow suite. Those areas either need controlled test data, have external dependencies, or create noise that does not improve confidence in search result quality. I also would not hard-assert every visual detail of the product grid because live merchandising content changes frequently.

## CAPTCHA Handling

If Liverpool added CAPTCHA to search, I would not try to bypass it. In CI, I would ask for a test-safe route: allowlisted runners, a lower environment with CAPTCHA disabled, or a mockable risk-service contract. I would keep one manual exploratory check for the real CAPTCHA behavior and move automated coverage to the application behavior after a successful risk decision.

## Flakiness Risks And Mitigations

Main risks are live content changes, slow network calls, overlay popups, localized labels, changing CSS, and service payload shape changes. The test mitigates these by preferring accessible selectors, supporting Spanish and English labels, waiting for product cards rather than fixed sleeps, collecting multiple possible JSON product shapes, attaching UI/network/discrepancy artifacts, and using CI retries only as a last-resort guard for live-site variance.

## Scaling In A Larger CI Pipeline

For a team pipeline with 50+ suites, I would split this into a small smoke job and a scheduled live-site validation job. The smoke job should run against stable lower-environment data or mocked service contracts; the live-site job should be quarantined from release blocking unless failures are confirmed. I would publish trend data for match rate, load time, accessibility violations, and selector failures so maintainability problems are visible before they become release noise.

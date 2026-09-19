import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { testData } from '../src/config/testData';
import { LiverpoolSearchPage } from '../src/pages/LiverpoolSearchPage';
import { extractProductsFromResponseJson, looksLikeProductResponse } from '../src/utils/networkProductExtractor';
import { formatProduct, productsMatch } from '../src/utils/normalizers';
import type { Product } from '../src/models/Product';

test.describe('Liverpool product search', () => {
  test('filters white PlayStation 5 results, validates service data, and logs first products', async ({ page }, testInfo) => {
    const networkProducts: Product[] = [];
    const pageObject = new LiverpoolSearchPage(page);
    const startedAt = Date.now();

    page.on('response', async (response) => {
      if (!looksLikeProductResponse(response.url(), response.headers()['content-type'] ?? null)) {
        return;
      }

      try {
        const parsedProducts = extractProductsFromResponseJson(await response.json());
        networkProducts.push(...parsedProducts);
      } catch {
        // Some JSON-like responses can be streams or protected payloads; they are not useful for this assertion.
      }
    });

    await pageObject.goto();
    await pageObject.searchFor(testData.searchTerm);
    await pageObject.filterByColor(testData.color);
    await pageObject.sortByLowestPrice();

    const elapsedMs = Date.now() - startedAt;
    expect(elapsedMs, `Results page should load in under ${testData.maxResultsLoadMs}ms`).toBeLessThan(testData.maxResultsLoadMs);

    const uiProducts = await pageObject.getVisibleProducts(testData.productLimit);
    expect(uiProducts, 'The UI should show enough products for the required extraction').toHaveLength(testData.productLimit);

    console.log(`First ${testData.productLimit} UI products:`);
    for (const product of uiProducts) {
      console.log(formatProduct(product));
    }

    const matchedProducts = uiProducts.filter((uiProduct) =>
      networkProducts.some((networkProduct) => productsMatch(uiProduct, networkProduct))
    );

    const discrepancies = uiProducts
      .filter((uiProduct) => !matchedProducts.includes(uiProduct))
      .map((uiProduct) => ({
        ui: uiProduct,
        closestNetworkCandidates: networkProducts
          .filter((networkProduct) => networkProduct.name.toLowerCase().includes(uiProduct.name.slice(0, 12).toLowerCase()))
          .slice(0, 3)
      }));

    await testInfo.attach('ui-products.json', {
      body: JSON.stringify(uiProducts, null, 2),
      contentType: 'application/json'
    });
    await testInfo.attach('network-products.json', {
      body: JSON.stringify(networkProducts.slice(0, 40), null, 2),
      contentType: 'application/json'
    });
    await testInfo.attach('discrepancies.json', {
      body: JSON.stringify(discrepancies, null, 2),
      contentType: 'application/json'
    });

    console.log(`Matched ${matchedProducts.length}/${uiProducts.length} UI products against intercepted responses.`);
    if (discrepancies.length > 0) {
      console.log(`Discrepancies: ${JSON.stringify(discrepancies, null, 2)}`);
    }

    expect(matchedProducts.length, 'At least 3 of the 5 UI products must exist in intercepted service data').toBeGreaterThanOrEqual(
      testData.minimumNetworkMatches
    );

    const accessibilityScanResults = await new AxeBuilder({ page }).exclude('[aria-hidden="true"]').analyze();
    await testInfo.attach('accessibility-violations.json', {
      body: JSON.stringify(accessibilityScanResults.violations, null, 2),
      contentType: 'application/json'
    });
    console.log(`Accessibility violations found: ${accessibilityScanResults.violations.length}`);
  });
});

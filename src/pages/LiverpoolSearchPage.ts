import { expect, type Locator, type Page } from '@playwright/test';
import type { Product } from '../models/Product';
import { parsePrice } from '../utils/normalizers';

export class LiverpoolSearchPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.dismissOverlays();
  }

  async searchFor(term: string): Promise<void> {
    const searchBox = this.page
      .getByRole('searchbox')
      .or(this.page.getByRole('textbox', { name: /buscar|search|encuentra/i }))
      .or(this.page.locator('input[placeholder*="buscar" i], input[placeholder*="search" i], input[type="search"]').first());

    await expect(searchBox.first()).toBeVisible();
    await searchBox.first().fill(term);
    await searchBox.first().press('Enter');
    await this.waitForResults();
  }

  async filterByColor(color: string): Promise<void> {
    const localizedColor = color.toLowerCase() === 'white' ? /white|blanco/i : new RegExp(color, 'i');

    await this.expandFilter(/color/i);

    const colorOption = this.page
      .getByRole('checkbox', { name: localizedColor })
      .or(this.page.getByRole('link', { name: localizedColor }))
      .or(this.page.getByRole('button', { name: localizedColor }))
      .or(this.page.locator('label, a, button').filter({ hasText: localizedColor }).first());

    await expect(colorOption.first()).toBeVisible();
    await colorOption.first().click();
    await this.waitForResults();
  }

  async sortByLowestPrice(): Promise<void> {
    const sortText = /menor precio|precio menor|lowest|low to high|menor a mayor/i;

    const combobox = this.page
      .getByRole('combobox', { name: /ordenar|sort/i })
      .or(this.page.locator('select').filter({ hasText: /ordenar|sort|precio/i }).first());

    if (await combobox.first().isVisible().catch(() => false)) {
      const matchingOptionValue = await combobox.first().evaluate((select, pattern) => {
        if (!(select instanceof HTMLSelectElement)) {
          return null;
        }

        const matcher = new RegExp(pattern, 'i');
        return Array.from(select.options).find((option) => matcher.test(option.label) || matcher.test(option.text))?.value ?? null;
      }, sortText.source);

      if (matchingOptionValue) {
        await combobox.first().selectOption(matchingOptionValue);
      } else {
        await combobox.first().click();
        await this.page.getByRole('option', { name: sortText }).click();
      }
    } else {
      const sortTrigger = this.page
        .getByRole('button', { name: /ordenar|sort/i })
        .or(this.page.locator('button, [role="button"]').filter({ hasText: /ordenar|sort/i }).first());

      await expect(sortTrigger.first()).toBeVisible();
      await sortTrigger.first().click();
      await this.page
        .getByRole('option', { name: sortText })
        .or(this.page.getByRole('menuitem', { name: sortText }))
        .or(this.page.locator('li, a, button').filter({ hasText: sortText }).first())
        .click();
    }

    await this.waitForResults();
  }

  async getVisibleProducts(limit: number): Promise<Product[]> {
    await this.waitForResults();

    const cards = this.productCards();
    await expect(cards.first()).toBeVisible();

    const products = await cards.evaluateAll((nodes, maxProducts) => {
      const pricePattern = /\$\s?[\d,]+(?:\.\d{2})?/;

      return nodes.slice(0, Number(maxProducts)).map((node) => {
        const element = node as HTMLElement;
        const text = element.innerText.replace(/\s+/g, ' ').trim();
        const price = text.match(pricePattern)?.[0] ?? null;
        const nameCandidate =
          element.querySelector('[data-testid*="name" i], [class*="name" i], h2, h3, a')?.textContent ??
          text.replace(price ?? '', '').trim();

        return {
          name: nameCandidate.replace(/\s+/g, ' ').trim(),
          rawPrice: price
        };
      });
    }, limit);

    return products
      .filter((product) => product.name)
      .map((product) => ({
        name: product.name,
        rawPrice: product.rawPrice,
        price: parsePrice(product.rawPrice),
        source: 'ui'
      }));
  }

  async dismissOverlays(): Promise<void> {
    const overlayButtons = [
      /aceptar|accept|entiendo|continuar/i,
      /cerrar|close/i,
      /no gracias|not now|despues/i
    ];

    for (const label of overlayButtons) {
      const button = this.page.getByRole('button', { name: label }).first();
      if (await button.isVisible().catch(() => false)) {
        await button.click().catch(() => undefined);
      }
    }
  }

  private async expandFilter(name: RegExp): Promise<void> {
    const filter = this.page
      .getByRole('button', { name })
      .or(this.page.getByText(name).locator('..').locator('button').first())
      .or(this.page.locator('button, [role="button"], summary').filter({ hasText: name }).first());

    if (await filter.first().isVisible().catch(() => false)) {
      const expanded = await filter.first().getAttribute('aria-expanded').catch(() => null);
      if (expanded !== 'true') {
        await filter.first().click();
      }
    }
  }

  private async waitForResults(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.dismissOverlays();
    await expect(this.productCards().first()).toBeVisible({ timeout: 30_000 });
  }

  private productCards(): Locator {
    return this.page
      .locator('[data-testid*="product" i], [class*="product" i], [class*="card" i], li')
      .filter({ hasText: /\$\s?[\d,]+/ });
  }
}

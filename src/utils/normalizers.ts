import type { Product } from '../models/Product';

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function parsePrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const cleaned = value.replace(/[^\d.,]/g, '').replace(/,/g, '');
  const parsed = Number.parseFloat(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}

export function pricesAreEquivalent(left: number | null, right: number | null): boolean {
  if (left === null || right === null) {
    return true;
  }

  return Math.abs(left - right) < 1;
}

export function productsMatch(uiProduct: Product, serviceProduct: Product): boolean {
  const uiName = normalizeText(uiProduct.name);
  const serviceName = normalizeText(serviceProduct.name);

  return (
    (uiName.includes(serviceName) || serviceName.includes(uiName)) &&
    pricesAreEquivalent(uiProduct.price, serviceProduct.price)
  );
}

export function formatProduct(product: Product): string {
  const price = product.rawPrice ?? (product.price === null ? 'N/A' : `$${product.price.toFixed(2)}`);
  return `${product.name} | ${price}`;
}

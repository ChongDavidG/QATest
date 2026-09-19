import type { Product } from '../models/Product';
import { parsePrice } from './normalizers';

type JsonRecord = Record<string, unknown>;

const nameKeys = ['name', 'displayName', 'productDisplayName', 'title', 'productName', 'skuDisplayName'];
const priceKeys = ['price', 'salePrice', 'listPrice', 'promoPrice', 'finalPrice', 'minimumListPrice', 'maximumListPrice'];

export function looksLikeProductResponse(url: string, contentType: string | null): boolean {
  if (!contentType?.includes('application/json')) {
    return false;
  }

  return /search|product|catalog|plp|browse|collection|sku|commerce|graphql/i.test(url);
}

export function extractProductsFromResponseJson(payload: unknown): Product[] {
  const products: Product[] = [];
  const visited = new WeakSet<object>();

  function visit(value: unknown): void {
    if (products.length >= 80 || value === null || typeof value !== 'object') {
      return;
    }

    if (visited.has(value)) {
      return;
    }

    visited.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }

    const record = value as JsonRecord;
    const product = productFromRecord(record);
    if (product) {
      products.push(product);
    }

    for (const child of Object.values(record)) {
      visit(child);
    }
  }

  visit(payload);

  return dedupeProducts(products);
}

function productFromRecord(record: JsonRecord): Product | null {
  const name = getFirstString(record, nameKeys);
  if (!name || name.length < 3) {
    return null;
  }

  const rawPrice = getFirstPriceCandidate(record);
  const price = parsePrice(rawPrice);

  if (price === null && !hasProductShape(record)) {
    return null;
  }

  return {
    name,
    price,
    rawPrice: typeof rawPrice === 'string' ? rawPrice : price === null ? null : String(price),
    source: 'network'
  };
}

function getFirstString(record: JsonRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getFirstPriceCandidate(record: JsonRecord): unknown {
  for (const key of priceKeys) {
    const value = record[key];
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = value as JsonRecord;
      const nestedValue = nested.value ?? nested.amount ?? nested.centAmount ?? nested.formattedValue;
      if (typeof nestedValue === 'string' || typeof nestedValue === 'number') {
        return nestedValue;
      }
    }
  }

  return null;
}

function hasProductShape(record: JsonRecord): boolean {
  return ['sku', 'productId', 'repositoryId', 'id'].some((key) => typeof record[key] === 'string');
}

function dedupeProducts(products: Product[]): Product[] {
  const seen = new Set<string>();

  return products.filter((product) => {
    const key = `${product.name.toLowerCase()}-${product.price ?? 'no-price'}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

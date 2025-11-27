import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_DIRECTUS_URL = 'http://173.212.215.18:8055';
const DEFAULT_DIRECTUS_TOKEN = 'wFd_KOyK9LJEZSe98DEu8Uww5wKGg1qD';
const DIRECTUS_URL = process.env.DIRECTUS_URL ?? DEFAULT_DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN ?? DEFAULT_DIRECTUS_TOKEN;
const PAGE_SIZE = 500;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT_DIR, 'public', 'size-filter-data.json');

async function fetchProductsPage(offset) {
  const params = new URLSearchParams({
    fields: 'size,diameter',
    limit: PAGE_SIZE.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${DIRECTUS_URL}/items/Product?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const message = `Directus responded with ${response.status}`;
    throw new Error(message);
  }

  const payload = await response.json();
  return payload?.data ?? [];
}

async function fetchAllProducts() {
  const products = [];
  let offset = 0;

  while (true) {
    const pageItems = await fetchProductsPage(offset);
    products.push(...pageItems);

    if (pageItems.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return products;
}

function buildDiameterSizeMap(products) {
  const map = new Map();

  for (const product of products) {
    const diameter = product?.diameter?.trim();
    const size = product?.size?.trim();

    if (!diameter || !size) continue;

    if (!map.has(diameter)) {
      map.set(diameter, new Set());
    }

    map.get(diameter).add(size);
  }

  return map;
}

function serializeMap(map) {
  const sortedDiameters = Array.from(map.keys()).sort((a, b) => {
    const parsedA = Number.parseFloat(a);
    const parsedB = Number.parseFloat(b);

    if (Number.isNaN(parsedA) || Number.isNaN(parsedB)) {
      return a.localeCompare(b, 'uk');
    }

    return parsedA - parsedB;
  });

  return sortedDiameters.reduce((acc, diameter) => {
    const sizes = Array.from(map.get(diameter) ?? []);
    sizes.sort((a, b) => a.localeCompare(b, 'uk'));

    acc[diameter] = sizes;
    return acc;
  }, {});
}

async function main() {
  try {
    console.log('Fetching products from Directus…');
    const products = await fetchAllProducts();
    console.log(`Fetched ${products.length} products`);

    const map = buildDiameterSizeMap(products);
    const serialized = serializeMap(map);

    await fs.writeFile(OUTPUT_PATH, JSON.stringify(serialized, null, 2) + '\n', 'utf8');
    console.log(`Saved size filter data to ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('Failed to build size filter data:', error);
    process.exit(1);
  }
}

main();


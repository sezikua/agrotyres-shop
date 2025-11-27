export type SizeFilterMap = Record<string, string[]>;

type SizeFilterItem = {
  diameter?: string | null;
  size?: string | null;
};

const SIZE_FILTER_STATIC_PATH = '/size-filter-data.json';

function sortValuesAlphabetically(values: string[]) {
  return [...values].sort((a, b) => a.localeCompare(b, 'uk'));
}

export function sortDiameterValues(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const parsedA = Number.parseFloat(a);
    const parsedB = Number.parseFloat(b);

    if (Number.isNaN(parsedA) || Number.isNaN(parsedB)) {
      return a.localeCompare(b, 'uk');
    }

    return parsedA - parsedB;
  });
}

export function buildSizeFilterMap(items: SizeFilterItem[]): SizeFilterMap {
  const map = new Map<string, Set<string>>();

  for (const item of items) {
    const diameter = item.diameter?.trim();
    const size = item.size?.trim();

    if (!diameter || !size) continue;

    if (!map.has(diameter)) {
      map.set(diameter, new Set());
    }

    map.get(diameter)?.add(size);
  }

  const result: SizeFilterMap = {};
  for (const [diameter, sizes] of map.entries()) {
    result[diameter] = sortValuesAlphabetically(Array.from(sizes));
  }

  return result;
}

async function fetchStaticSizeFilterData(): Promise<SizeFilterMap> {
  const response = await fetch(SIZE_FILTER_STATIC_PATH, {
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new Error(`Failed to load static size filter data: ${response.status}`);
  }

  return (await response.json()) as SizeFilterMap;
}

export async function loadSizeFilterData(): Promise<SizeFilterMap> {
  try {
    return await fetchStaticSizeFilterData();
  } catch (error) {
    console.warn('[sizeFilterData] Static data unavailable, falling back to API', error);
    const response = await fetch('/api/products?limit=1000', { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Failed to load fallback size filter data: ${response.status}`);
    }

    const payload = (await response.json()) as { data?: SizeFilterItem[] };
    return buildSizeFilterMap(payload.data ?? []);
  }
}


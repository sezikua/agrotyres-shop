const BRAND_ORDER = ["Trelleborg", "Mitas", "CEAT"] as const;

export function detectBrand(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = candidate.toLowerCase();
    for (const brand of BRAND_ORDER) {
      if (normalized.includes(brand.toLowerCase())) {
        return brand;
      }
    }
  }
  return "CEAT";
}

export function importerHeadline(brand: string): string {
  return `Агро-Солар — офіційний імпортер в Україні шин ${brand}`;
}

export function sanitizeDescription(text?: string | null): string {
  if (!text) return "";
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function availabilityInfo(warehouse?: string | null) {
  const normalized = (warehouse || "").toLowerCase();
  const inStock = normalized === "in stock";
  return {
    short: inStock ? "в наявності" : "під замовлення",
    phrase: inStock ? "в наявності у Agro-Solar в Україні" : "під замовлення у Agro-Solar в Україні",
  };
}


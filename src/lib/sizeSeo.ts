export const SEGMENT_DESCRIPTION_MAP: Record<string, string> = {
  "Сільськогосподарські шини (С/Г)": "сільськогосподарських шин для підвищення ефективності та збереження ґрунту",
  "Будівельні шини": "будівельних шин для високої прохідності та стійкості до пошкоджень на екскаваторах і навантажувачах",
  "Шини для газонокосарок та саду": "садових шин з мінімальним тиском на ґрунт для мінітехніки та газонокосарок",
  "Шини для лісової техніки": "лісових шин із посиленим каркасом для форвардерів та харвестерів",
  "Кар'єрні шини (Гірнича техніка)": "кар'єрних шин, що витримують екстремальні навантаження у шахтах та розробках",
  "Портові та складські шини": "портових і складських шин для стабільної роботи річтракерів і термінальних тягачів",
  "Індустріальні та багатофункціональні шини": "універсальних індустріальних шин для телескопічних навантажувачів і спецтехніки",
};

export const CATEGORY_LIST_LABELS: Record<string, string> = {
  "Трактори (Стандартна та Середня Потужність)": "тракторів стандартної та середньої потужності",
  "Трактори Великої Потужності": "тракторів великої потужності",
  "Комбайни": "комбайнів",
  "Обприскувачі": "обприскувачів",
  "Навісне та Причіпне Обладнання": "навісного та причіпного обладнання",
  "Будівельна та Землерійна Техніка (OTR)": "будівельної та землерийної техніки",
  "Навантажувачі (Телескопічні, Колісні, Екскаватори-навантажувачі)": "навантажувачів та екскаваторів-навантажувачів",
  "Міні-навантажувачі (Skid Steer)": "міні-навантажувачів",
  "Лісова Техніка": "лісової техніки",
  "Спеціальна, Портова та Шахтна Техніка": "спеціальної, портової та шахтної техніки",
};

export function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} та ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} та ${items[items.length - 1]}`;
}

export function buildCategoriesList(categories: string[]): { list: string; raw: string[] } {
  if (categories.length === 0) {
    return { list: "різної сільськогосподарської техніки", raw: [] };
  }
  const normalized = categories.map((category) => CATEGORY_LIST_LABELS[category] || category);
  return { list: formatList(normalized), raw: categories };
}

export function buildSegmentsDescription(segments: string[]): string {
  if (segments.length === 0) {
    return "різних напрямів аграрної та індустріальної техніки";
  }
  const phrases = segments.map(
    (segment) => SEGMENT_DESCRIPTION_MAP[segment] || `рішень для сегмента ${segment.toLowerCase()}`
  );
  return formatList(phrases);
}

export function deriveSizeSeoData(
  products: Array<{ Category?: string | null; Segment?: string | null }>
): { categories: string[]; segments: string[]; categoriesList: string; segmentsDescription: string } {
  const uniqueCategories = Array.from(
    new Set(products.map((p) => p.Category).filter((value): value is string => Boolean(value)))
  );
  const uniqueSegments = Array.from(
    new Set(products.map((p) => p.Segment).filter((value): value is string => Boolean(value)))
  );
  const { list: categoriesList } = buildCategoriesList(uniqueCategories);
  const segmentsDescription = buildSegmentsDescription(uniqueSegments);

  return {
    categories: uniqueCategories,
    segments: uniqueSegments,
    categoriesList,
    segmentsDescription,
  };
}


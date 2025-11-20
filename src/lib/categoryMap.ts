export const CATEGORY_UI_TO_API: Record<string, string> = {
  "Трактори Великої Потужності": "High Power Tractor",
  "Комбайни": "Harvester",
  "Обприскувачі": "Sprayer",
};

export function mapCategoryToApi(categoryName: string): string {
  return CATEGORY_UI_TO_API[categoryName] || categoryName;
}


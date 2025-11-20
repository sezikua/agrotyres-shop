const CATEGORY_TO_DIRECTUS: Record<string, string> = {
  "Навісне та Причіпне Обладнання": "Навісне та Причіпне Обладнання",
  "Flotation/Agri Transport": "Навісне та Причіпне Обладнання",
  "Трактори Великої Потужності": "Трактори Великої Потужності",
  "High Power Tractor": "Трактори Великої Потужності",
  "Комбайни": "Комбайни",
  "Harvester": "Комбайни",
  "Обприскувачі": "Обприскувачі",
  "Sprayer": "Обприскувачі",
};

export function mapCategoryToApi(categoryName: string): string {
  return CATEGORY_TO_DIRECTUS[categoryName] || categoryName;
}


/**
 * Lowercases and strips diacritics so "jalon" matches "Jalón". Used both when
 * storing searchable names and when normalizing the user's query.
 */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

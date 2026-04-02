export type CategoryOption = {
  value: string;
  label: string;
};

export function normalizeCategory(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

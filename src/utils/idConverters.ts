
/**
 * Ensure IDs are consistently formatted as strings
 */
export function toStringId(id: string | number | undefined): string {
  if (id === undefined || id === null) {
    return '';
  }
  return String(id);
}

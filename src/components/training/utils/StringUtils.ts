
// Helper function to safely get string values
export const safeString = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    if (value && 'name' in value) return String(value.name);
    if (value && 'title' in value) return String(value.title);
    if (value && 'id' in value) return String(value.id);
    try {
      return JSON.stringify(value);
    } catch (e) {
      return "[Object]";
    }
  }
  return String(value);
};

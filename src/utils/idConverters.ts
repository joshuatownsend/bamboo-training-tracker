
/**
 * Utility functions for consistently handling ID conversions between
 * database integer IDs and UI string IDs
 */

/**
 * Safely converts any ID type to string for UI use
 * @param id The ID to convert (can be number, string, or undefined/null)
 * @param fallback Optional fallback value if id is null/undefined
 * @returns A string representation of the ID or fallback value
 */
export const toStringId = (id: string | number | null | undefined, fallback: string = "unknown"): string => {
  if (id === null || id === undefined) {
    return fallback;
  }
  return String(id);
};

/**
 * Safely accesses a property on an object that might be null/undefined
 * @param obj The object to access
 * @param prop The property name to access
 * @param fallback Optional fallback value if property doesn't exist
 * @returns The property value or fallback
 */
export const safeProperty = <T, K extends keyof T>(
  obj: T | null | undefined, 
  prop: K, 
  fallback: any = undefined
): T[K] | undefined => {
  if (obj === null || obj === undefined) {
    return fallback;
  }
  return obj[prop] !== undefined ? obj[prop] : fallback;
};

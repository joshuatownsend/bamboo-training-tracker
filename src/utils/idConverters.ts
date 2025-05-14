
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
 * Safely converts any ID type to number for database use
 * @param id The ID to convert (can be number, string, or undefined/null)
 * @param fallback Optional fallback value if id is null/undefined or not a valid number
 * @returns A number representation of the ID or fallback value
 */
export const toNumberId = (id: string | number | null | undefined, fallback: number | null = null): number | null => {
  if (id === null || id === undefined) {
    return fallback;
  }
  
  const parsed = typeof id === 'string' ? parseInt(id, 10) : id;
  
  return isNaN(parsed as number) ? fallback : parsed as number;
};

/**
 * Safely checks if a value is not null or undefined
 * @param value The value to check
 * @returns True if the value is not null or undefined
 */
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
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

/**
 * Type guard to check if a record has a specific property
 * @param obj The object to check
 * @param propertyName The property name to check
 * @returns True if the object has the property and it's not null/undefined
 */
export function hasProperty<T, K extends PropertyKey>(
  obj: T,
  propertyName: K
): obj is T & Record<K, unknown> {
  return obj !== null && 
         obj !== undefined && 
         typeof obj === 'object' && 
         propertyName in obj && 
         obj[propertyName as keyof T] !== null && 
         obj[propertyName as keyof T] !== undefined;
}

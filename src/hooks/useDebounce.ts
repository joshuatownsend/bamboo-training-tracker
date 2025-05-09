
import { useState, useEffect } from 'react';

/**
 * A hook that delays updating a value for specified milliseconds
 * Useful for preventing excessive rerenders with text inputs
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds (default: 750ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 750): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes or component unmounts
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

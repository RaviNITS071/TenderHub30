/**
 * @file src/hooks/useDebounce.js
 * @description Delays state updates to prevent excessive API calls during text input.
 */
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timer to update the value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timer if the user types again before the delay finishes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
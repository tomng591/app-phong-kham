import { useState, useEffect } from 'react';

/**
 * Custom hook for syncing state with localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Lazy initialization from localStorage
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Sync to localStorage on change
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export const STORAGE_KEYS = {
  SETTINGS: 'clinic-scheduler-settings',
  TASKS: 'clinic-scheduler-tasks',
  DOCTORS: 'clinic-scheduler-doctors',
  DAILY_PATIENTS: 'clinic-scheduler-daily-patients',
  WORKING_DOCTORS: 'clinic-scheduler-working-doctors',
} as const;

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
  // Morning session
  MORNING_PATIENTS: 'clinic-scheduler-morning-patients',
  MORNING_WORKING_DOCTORS: 'clinic-scheduler-morning-working-doctors',
  MORNING_MANUAL_APPOINTMENTS: 'clinic-scheduler-morning-manual-appointments',
  // Afternoon session
  AFTERNOON_PATIENTS: 'clinic-scheduler-afternoon-patients',
  AFTERNOON_WORKING_DOCTORS: 'clinic-scheduler-afternoon-working-doctors',
  AFTERNOON_MANUAL_APPOINTMENTS: 'clinic-scheduler-afternoon-manual-appointments',
} as const;

import { useEffect, useState } from "react";
import { storage } from "./storage";

export const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = storage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error("Error parsing local storage value", error);
      return defaultValue;
    }
  });

  useEffect(() => {
    storage.setItem(key, JSON.stringify(value));
  }, [value, key]);

  return [value, setValue] as const;
};

interface Storage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const browserStorage: Storage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
};

const nodeStorage: Storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const storage: Storage =
  typeof window !== "undefined" ? browserStorage : nodeStorage;

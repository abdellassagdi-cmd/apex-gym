import "expo-sqlite/localStorage/install";

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const rawValue = localStorage.getItem(key);
      return rawValue ? (JSON.parse(rawValue) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage write failures and keep the in-memory state alive.
    }
  },

  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage removal failures and keep the app usable.
    }
  },
};

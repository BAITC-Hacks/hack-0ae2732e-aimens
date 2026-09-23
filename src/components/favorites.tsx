"use client";
import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Bookmark } from "lucide-react";
import { useDemo } from "./demo-provider";
import { useLocale } from "./locale-provider";

const key = "sanalink-favorites";
const changeEvent = "sanalink-favorites-change";
let memory = "{}";
let useMemory = false;
function snapshot() {
  if (useMemory) return memory;
  try {
    return localStorage.getItem(key) ?? memory;
  } catch {
    return memory;
  }
}
function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, onChange);
  };
}
function decode(raw: string): Record<string, string[]> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      return Object.fromEntries(
        Object.entries(parsed).filter(
          ([, value]) =>
            Array.isArray(value) &&
            value.every((item) => typeof item === "string"),
        ),
      );
  } catch {
    /* Damaged browser preferences do not affect server data. */
  }
  return {};
}
const FavoritesContext = createContext<{
  ids: string[];
  toggle: (id: string) => void;
}>({ ids: [], toggle: () => {} });
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { actor } = useDemo();
  const raw = useSyncExternalStore(subscribe, snapshot, () => "{}");
  const saved = useMemo(() => decode(raw), [raw]);
  function toggle(id: string) {
    const current = decode(snapshot());
    const ids = current[actor] ?? [];
    memory = JSON.stringify({
      ...current,
      [actor]: ids.includes(id)
        ? ids.filter((item) => item !== id)
        : [...ids, id],
    });
    try {
      localStorage.setItem(key, memory);
    } catch {
      useMemory = true;
    }
    window.dispatchEvent(new Event(changeEvent));
  }
  return (
    <FavoritesContext.Provider value={{ ids: saved[actor] ?? [], toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}
export const useFavorites = () => useContext(FavoritesContext);
export function FavoriteButton({ id, title }: { id: string; title: string }) {
  const { ids, toggle } = useFavorites();
  const { t } = useLocale();
  const saved = ids.includes(id);
  return (
    <button
      className={`icon-button favorite-button ${saved ? "saved" : ""}`}
      aria-label={`${t(saved ? "Убрать из избранного" : "Сохранить задачу")}: ${t(title)}`}
      aria-pressed={saved}
      onClick={() => toggle(id)}
    >
      <Bookmark size={19} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

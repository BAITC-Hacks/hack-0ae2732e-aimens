"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { Action, ActionResult, Snapshot } from "@/domain/task";

const ACTOR_STORAGE_KEY = "praktika-demo-actor";
const demoActors = new Set([
  "business",
  "team-1",
  "team-2",
  "team-3",
  "team-4",
  "team-5",
]);

function isDemoActor(value: string | null): value is string {
  return value !== null && demoActors.has(value);
}

type DemoContextValue = {
  actor: string;
  setActor: (actor: string) => void;
  data: Snapshot | null;
  loading: boolean;
  busy: boolean;
  error: string;
  notice: string;
  refreshFailed: boolean;
  clearNotice: () => void;
  reload: () => Promise<void>;
  act: (action: Action, success: string) => Promise<ActionResult>;
};
const DemoContext = createContext<DemoContextValue | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [actor, setActorState] = useState("business");
  const [actorReady, setActorReady] = useState(false);
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshFailed, setRefreshFailed] = useState(false);
  // An identity token distinguishes business → team → business from one session.
  const session = useRef({ actor: "business" });
  const snapshot = useRef<Snapshot | null>(null);
  const requestVersion = useRef(0);
  useEffect(() => {
    const restoreActor = window.setTimeout(() => {
      try {
        const storedActor = window.sessionStorage.getItem(ACTOR_STORAGE_KEY);
        if (isDemoActor(storedActor)) {
          session.current = { actor: storedActor };
          setActorState(storedActor);
        } else if (storedActor !== null)
          window.sessionStorage.removeItem(ACTOR_STORAGE_KEY);
      } catch {
        /* The demo still works when browser storage is unavailable. */
      } finally {
        setActorReady(true);
      }
    }, 0);
    return () => window.clearTimeout(restoreActor);
  }, []);
  const reload = useCallback(async () => {
    const owner = session.current;
    const version = ++requestVersion.current;
    const current = () =>
      session.current === owner && requestVersion.current === version;
    // Background refresh must not unmount an editor or a partially filled form.
    if (!snapshot.current) setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/demo", {
        headers: { "x-demo-actor": owner.actor },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Не удалось обновить данные");
      if (!current()) return;
      snapshot.current = result as Snapshot;
      setData(result);
      setRefreshFailed(false);
    } catch (err) {
      if (!current()) return;
      setError(
        err instanceof Error ? err.message : "Не удалось обновить данные",
      );
      setRefreshFailed(true);
      throw err;
    } finally {
      if (current()) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!actorReady) return;
    const start = window.setTimeout(() => {
      void reload().catch(() => {});
    }, 0);
    return () => {
      window.clearTimeout(start);
      requestVersion.current += 1;
    };
  }, [actor, actorReady, reload]);
  function setActor(next: string) {
    if (!isDemoActor(next)) return;
    try {
      window.sessionStorage.setItem(ACTOR_STORAGE_KEY, next);
    } catch {
      /* Persisting the selector is optional for restricted browsers. */
    }
    if (next === session.current.actor) return;
    session.current = { actor: next };
    snapshot.current = null;
    requestVersion.current += 1;
    setActorState(next);
    setData(null);
    setLoading(true);
    setBusy(false);
    setError("");
    setNotice("");
    setRefreshFailed(false);
  }
  async function act(action: Action, success: string) {
    const owner = session.current;
    const assertCurrent = () => {
      if (session.current !== owner)
        throw new DOMException("Демопрофиль изменён", "AbortError");
    };
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-actor": owner.actor,
        },
        body: JSON.stringify(action),
      });
      const result = await response.json();
      assertCurrent();
      if (!response.ok) throw new Error(result.error);
      try {
        await reload();
      } catch {
        assertCurrent();
        // The write was acknowledged: never ask the caller to submit it again.
        setError(
          "Действие сохранено. Не удалось обновить список — обновите данные.",
        );
      }
      assertCurrent();
      setNotice(success);
      return result as ActionResult;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Не удалось выполнить действие";
      if (session.current === owner) setError(message);
      throw err;
    } finally {
      if (session.current === owner) setBusy(false);
    }
  }
  return (
    <DemoContext.Provider
      value={{
        actor,
        setActor,
        data,
        loading,
        busy,
        error,
        notice,
        refreshFailed,
        clearNotice: () => {
          setNotice("");
          setError("");
        },
        reload,
        act,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("Missing DemoProvider");
  return value;
}

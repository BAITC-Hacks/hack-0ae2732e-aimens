"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  useEffect(() => {
    const restoreActor = window.setTimeout(() => {
      try {
        const storedActor = window.sessionStorage.getItem(ACTOR_STORAGE_KEY);
        if (isDemoActor(storedActor)) setActorState(storedActor);
        else if (storedActor !== null)
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
    const response = await fetch("/api/demo", {
      headers: { "x-demo-actor": actor },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setData(result);
  }, [actor]);
  useEffect(() => {
    if (!actorReady) return;
    let active = true;
    fetch("/api/demo", {
      headers: { "x-demo-actor": actor },
      cache: "no-store",
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (active) {
          setData(result);
          setError("");
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [actor, actorReady]);
  function setActor(next: string) {
    if (!isDemoActor(next)) return;
    try {
      window.sessionStorage.setItem(ACTOR_STORAGE_KEY, next);
    } catch {
      /* Persisting the selector is optional for restricted browsers. */
    }
    if (next === actor) return;
    setActorState(next);
    setLoading(true);
    setError("");
    setNotice("");
  }
  async function act(action: Action, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-actor": actor },
        body: JSON.stringify(action),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await reload();
      setNotice(success);
      return result as ActionResult;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Не удалось выполнить действие";
      setError(message);
      throw err;
    } finally {
      setBusy(false);
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

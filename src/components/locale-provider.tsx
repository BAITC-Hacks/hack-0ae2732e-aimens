"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { kk } from "@/i18n/kk";
import { en } from "@/i18n/en";

export type Locale = "ru" | "kk" | "en";

const dictionaries: Record<Locale, Record<string, string>> = { ru: {}, kk, en };
const STORAGE_KEY = "sanalink-locale";
const ORIGINAL_TITLE = "SanaLink — реальные задачи, сильные команды";
const attributes = ["aria-label", "placeholder", "title", "alt"] as const;

type LocaleValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (source: string) => string;
};
const LocaleContext = createContext<LocaleValue | null>(null);

type Tracked = { source: string; rendered: string };

function translateText(source: string, locale: Locale) {
  // Russian is the authored source, including task names and user-entered text.
  if (locale === "ru") return source;
  const trimmed = source.trim();
  if (!trimmed) return source;
  const key = trimmed.replace(/\s+/gu, " ");
  const translated = dictionaries[locale][trimmed] ?? dictionaries[locale][key];
  if (!translated) return source;
  return (
    source.slice(0, source.indexOf(trimmed)) +
    translated +
    source.slice(source.indexOf(trimmed) + trimmed.length)
  );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ru");
  const texts = useRef(new WeakMap<Text, Tracked>());
  const attrs = useRef(new WeakMap<Element, Map<string, Tracked>>());

  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved === "ru" || saved === "kk" || saved === "en")
          setLocale(saved);
      } catch {
        // Language switching remains available when browser storage is blocked.
      }
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translateText(ORIGINAL_TITLE, locale);

    const skipped = (element: Element | null) =>
      !!element?.closest(
        "[data-no-translate], script, style, svg, [contenteditable]",
      );

    const translateNode = (node: Text) => {
      if (skipped(node.parentElement)) return;
      // A textarea's text node is its default value. An option without an
      // explicit value derives its submitted value from its text content.
      if (node.parentElement?.closest("textarea, input, option:not([value])"))
        return;
      const current = node.nodeValue ?? "";
      const previous = texts.current.get(node);
      const source =
        previous && current === previous.rendered ? previous.source : current;
      const rendered = translateText(source, locale);
      texts.current.set(node, { source, rendered });
      if (current !== rendered) node.nodeValue = rendered;
    };

    const translateElement = (element: Element) => {
      if (skipped(element)) return;
      const records = attrs.current.get(element) ?? new Map<string, Tracked>();
      for (const attribute of attributes) {
        const current = element.getAttribute(attribute);
        if (current === null) continue;
        const previous = records.get(attribute);
        const source =
          previous && current === previous.rendered ? previous.source : current;
        const rendered = translateText(source, locale);
        records.set(attribute, { source, rendered });
        if (current !== rendered) element.setAttribute(attribute, rendered);
      }
      attrs.current.set(element, records);
    };

    const translateTree = (root: Element) => {
      translateElement(root);
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      );
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.nodeType === Node.TEXT_NODE) translateNode(node as Text);
        else translateElement(node as Element);
      }
    };

    let queued = false;
    let disposed = false;
    const refresh = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        if (!disposed && document.body) {
          translateTree(document.body);
          // Ignore our own mutations; later React updates remain observable.
          observer.takeRecords();
        }
      });
    };
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...attributes],
    });
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [locale]);

  const changeLocale = (next: Locale) => {
    setLocale(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persistence is optional; the active interface language still changes.
    }
  };

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale: changeLocale,
        t: (source) => translateText(source, locale),
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("Missing LocaleProvider");
  return value;
}

"use client";

import { useCallback, useEffect, useState } from "react";

function readStored(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === "true") return true;
    if (raw === "false") return false;
  } catch {
    /* ignore */
  }
  return defaultValue;
}

/** Persisted boolean for TTG dashboard sidebar open state. */
export function useLocalStorageBoolean(
  key: string,
  defaultValue: boolean
): [boolean, (value: boolean | ((prev: boolean) => boolean)) => void] {
  const [state, setState] = useState(defaultValue);

  useEffect(() => {
    setState(readStored(key, defaultValue));
  }, [key, defaultValue]);

  const setValue = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        try {
          window.localStorage.setItem(key, next ? "true" : "false");
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [key]
  );

  return [state, setValue];
}

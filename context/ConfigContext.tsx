// context/ConfigContext.tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { AppConfig } from "../lib/fetchConfig";
import { fetchConfig } from "../lib/fetchConfig";

type State = {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
};

const ConfigContext = createContext<State>({
  config: null,
  loading: true,
  error: null,
});

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({
    config: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await fetchConfig();
        if (!cancelled) setState({ config: cfg, loading: false, error: null });
      } catch (e: any) {
        if (!cancelled)
          setState({
            config: null,
            loading: false,
            error: e?.message || "CONFIG_ERROR",
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ConfigContext.Provider value={state}>{children}</ConfigContext.Provider>
  );
}

export const useAppConfig = () => useContext(ConfigContext);

// context/ConfigContext.tsx
"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import type { AppConfig } from "../lib/fetchConfig";
import { fetchConfig } from "../lib/fetchConfig";

/** ===== Tipado del contexto ===== */
type ConfigContextType = {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const ConfigContext = createContext<ConfigContextType>({
  config: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

/** ===== Provider principal ===== */
export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ⚡ Evita doble fetch con React.StrictMode
  const loadedOnce = useRef(false);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchConfig();
      setConfig(data);
    } catch (e: any) {
      console.error("Error cargando configuración:", e);
      setError(e?.message || "Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadedOnce.current) {
      loadedOnce.current = true;
      loadConfig();
    }
  }, []);

  return (
    <ConfigContext.Provider
      value={{
        config,
        loading,
        error,
        refresh: loadConfig,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

/** ===== Hook de acceso ===== */
export function useAppConfig() {
  return useContext(ConfigContext);
}

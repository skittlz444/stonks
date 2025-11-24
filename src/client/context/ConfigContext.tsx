import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { ConfigData } from '../types';

interface ConfigContextType {
  configData: ConfigData | null;
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  refetch: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  const fetchConfigData = async () => {
    try {
      // Only show full loading on initial mount
      if (isInitialMount.current) {
        setLoading(true);
      } else {
        // Show refreshing state for subsequent fetches
        setIsRefreshing(true);
      }
      setError(null);

      const response = await fetch('/api/config-data');

      if (!response.ok) {
        throw new Error(`Failed to fetch config data: ${response.statusText}`);
      }

      const data = await response.json() as ConfigData & { error?: string };

      if (data.error) {
        throw new Error(data.error);
      }

      setConfigData(data);
      
      if (isInitialMount.current) {
        isInitialMount.current = false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading config data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConfigData();
  }, []);

  return (
    <ConfigContext.Provider value={{ configData, loading, error, isRefreshing, refetch: fetchConfigData }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

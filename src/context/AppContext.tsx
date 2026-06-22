import {createContext, useContext, type ReactNode} from 'react';

/**
 * Stable, low-frequency application context.
 * Holds values that rarely change and are consumed broadly:
 * current user, AI platform status, snapshot version, and host URL.
 *
 * This is the "Context" layer of the three-tier state model
 * (React Query for server state, Zustand for UI state, Context for stable deps).
 */

export interface AppUser {
  username: string;
  displayName: string;
  role: string;
}

export interface AppContextValue {
  user: AppUser;
  aiVersion: string;
  aiReady: boolean;
  snapshotVersion: string;
  appUrl: string;
}

const DEFAULT_VALUE: AppContextValue = {
  user: {
    username: 'linzhang0222',
    displayName: 'linzhang0222',
    role: '超级系统管理员',
  },
  aiVersion: 'v1.3.0',
  aiReady: true,
  snapshotVersion: 'v1.3.0',
  appUrl: typeof window !== 'undefined' ? window.location.origin : '',
};

const AppContext = createContext<AppContextValue>(DEFAULT_VALUE);

export interface AppProviderProps {
  children: ReactNode;
  value?: Partial<AppContextValue>;
}

export function AppProvider({children, value}: AppProviderProps) {
  const merged: AppContextValue = {...DEFAULT_VALUE, ...value};
  return <AppContext.Provider value={merged}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  return useContext(AppContext);
}

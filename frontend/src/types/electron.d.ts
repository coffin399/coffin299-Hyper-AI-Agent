// Type definitions for Electron API exposed via preload

export interface BackendConfig {
  mode: 'local' | 'network';
  apiBaseUrl: string;
}

export interface Settings {
  backendMode: 'local' | 'network';
  backendPort: number;
  networkApiUrl: string;
}

export interface ElectronAPI {
  onBackendConfig: (callback: (config: BackendConfig) => void) => void;
  getSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};

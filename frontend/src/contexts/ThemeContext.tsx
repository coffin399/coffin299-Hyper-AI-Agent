import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    // ローカルストレージからテーマ設定を取得
    const saved = localStorage.getItem('theme-mode');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // システムのテーマ設定を取得
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const theme = createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // ライトモードのカスタムカラー
            primary: {
              main: '#667eea',
            },
            secondary: {
              main: '#764ba2',
            },
            background: {
              default: '#f8f9fa',
              paper: '#ffffff',
            },
          }
        : {
            // ダークモードのカスタムカラー
            primary: {
              main: '#667eea',
            },
            secondary: {
              main: '#764ba2',
            },
            background: {
              default: '#0a0a0a',
              paper: '#1a1a1a',
            },
          }),
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'dark'
              ? '0 18px 45px rgba(0, 0, 0, 0.6)'
              : '0 18px 45px rgba(15, 23, 42, 0.18)',
            backdropFilter: 'blur(18px)',
            backgroundColor: mode === 'dark'
              ? 'rgba(15, 15, 25, 0.82)'
              : 'rgba(255, 255, 255, 0.82)',
            border: mode === 'dark'
              ? '1px solid rgba(148, 163, 184, 0.25)'
              : '1px solid rgba(148, 163, 184, 0.18)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'dark'
              ? '0 18px 45px rgba(0, 0, 0, 0.55)'
              : '0 18px 45px rgba(15, 23, 42, 0.16)',
            backdropFilter: 'blur(18px)',
            backgroundColor: mode === 'dark'
              ? 'rgba(15, 15, 25, 0.78)'
              : 'rgba(255, 255, 255, 0.86)',
            border: mode === 'dark'
              ? '1px solid rgba(148, 163, 184, 0.25)'
              : '1px solid rgba(148, 163, 184, 0.16)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 600,
            padding: '12px 24px',
            fontSize: '0.95rem',
            transition: 'all 0.3s ease',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'all 0.3s ease',
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: mode === 'dark'
              ? '1px solid rgba(148, 163, 184, 0.35)'
              : '1px solid rgba(148, 163, 184, 0.24)',
            backgroundColor: mode === 'dark'
              ? 'rgba(8, 8, 15, 0.9)'
              : 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(20px)',
            boxShadow: mode === 'dark'
              ? '0 0 40px rgba(0, 0, 0, 0.8)'
              : '0 0 32px rgba(15, 23, 42, 0.35)',
          },
        },
      },
    },
  });

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  // システムテーマ変更を監視
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // ユーザーが明示的に設定していない場合のみシステムテーマに従う
      if (!localStorage.getItem('theme-mode')) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, theme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

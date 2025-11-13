import React from 'react';
import {
  IconButton,
  Tooltip,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();

  return (
    <Tooltip title={mode === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え'}>
      <IconButton
        onClick={toggleTheme}
        sx={{
          color: muiTheme.palette.primary.main,
          '&:hover': {
            backgroundColor: muiTheme.palette.action.hover,
          },
        }}
      >
        {mode === 'light' ? <DarkMode /> : <LightMode />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;

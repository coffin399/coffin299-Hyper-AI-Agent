import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import {
  SmartToy,
  Settings,
} from '@mui/icons-material';
import ThemeToggle from './ThemeToggle';

interface AppHeaderProps {
  title?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title = 'Hyper AI Agent' }) => {
  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Box display="flex" alignItems="center" flexGrow={1}>
          <SmartToy sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          <ThemeToggle />
          <IconButton color="inherit">
            <Settings />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;

import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  SmartToy,
  Cloud,
  Description,
  Settings,
  Person,
  VideoLibrary,
  MeetingRoom,
  Chat,
  DocumentScanner,
  ChatBubble,
  Message,
} from '@mui/icons-material';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const drawerWidth = 240;

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: <Dashboard /> },
    { id: 'models', label: 'モデル管理', icon: <SmartToy /> },
    { id: 'google', label: 'Google連携', icon: <Cloud /> },
    { id: 'discord', label: 'Discord連携', icon: <ChatBubble /> },
    { id: 'line', label: 'LINE連携', icon: <Message /> },
    { id: 'docs', label: 'AIドキュメント', icon: <Description /> },
    { id: 'roles', label: 'AIロール', icon: <Person /> },
    { id: 'media', label: 'AIメディア', icon: <VideoLibrary /> },
    { id: 'meeting', label: 'AI会議', icon: <MeetingRoom /> },
    { id: 'chat', label: 'AIチャット', icon: <Chat /> },
    { id: 'ocr', label: 'AI OCR', icon: <DocumentScanner /> },
    { id: 'settings', label: '設定', icon: <Settings /> },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="primary" fontWeight={600}>
          Hyper AI Agent
        </Typography>
      </Box>
      
      <Divider />
      
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Version 1.0.0
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Navigation;

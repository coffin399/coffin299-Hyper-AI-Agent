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
  IconButton,
  Tooltip,
  Avatar,
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
  DocumentScanner,
  ChatBubble,
  ChevronLeft,
  ChevronRight,
  LibraryBooks,
} from '@mui/icons-material';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  open: boolean;
  onToggle: () => void;
}

const drawerWidth = 240;
const miniDrawerWidth = 64;

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, open, onToggle }) => {
  const menuItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: <Dashboard /> },
    { id: 'models', label: 'モデル管理', icon: <SmartToy /> },
    { id: 'flows', label: '自動フロー', icon: <ChatBubble /> },
    { id: 'google', label: 'Google連携', icon: <Cloud /> },
    { id: 'discord', label: 'Discord連携', icon: <Avatar src="icons/Discord_logo.png" alt="Discord" sx={{ width: 24, height: 24 }} /> },
    { id: 'line', label: 'LINE連携', icon: <Avatar src="icons/LINE_logo.png" alt="LINE" sx={{ width: 24, height: 24 }} /> },
    { id: 'slack', label: 'Slack連携', icon: <Avatar src="icons/Slack_logo.png" alt="Slack" sx={{ width: 24, height: 24 }} /> },
    { id: 'docs', label: 'AIドキュメント', icon: <Description /> },
    { id: 'knowledge', label: 'ナレッジRAG', icon: <LibraryBooks /> },
    { id: 'roles', label: 'AIロール', icon: <Person /> },
    { id: 'media', label: 'AIメディア', icon: <VideoLibrary /> },
    { id: 'meeting', label: 'AI会議', icon: <MeetingRoom /> },
    { id: 'chat', label: 'AIチャット', icon: <ChatBubble /> },
    { id: 'ocr', label: 'AI OCR', icon: <DocumentScanner /> },
    { id: 'settings', label: '設定', icon: <Settings /> },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : miniDrawerWidth,
        flexShrink: 0,
        transition: 'width 0.3s',
        [`& .MuiDrawer-paper`]: {
          width: open ? drawerWidth : miniDrawerWidth,
          boxSizing: 'border-box',
          transition: 'width 0.3s',
          overflowX: 'hidden',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {open && (
          <Typography variant="h6" color="primary" fontWeight={600} noWrap>
            Hyper AI Agent
          </Typography>
        )}
        <Tooltip title={open ? 'サイドバーを最小化' : 'サイドバーを展開'}>
          <IconButton onClick={onToggle} size="small">
            {open ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        </Tooltip>
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
              <ListItemIcon sx={{ minWidth: open ? 56 : 'auto', justifyContent: 'center' }}>
                {item.icon}
              </ListItemIcon>
              {open && <ListItemText primary={item.label} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      {open && (
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Version 1.0.0
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};

export default Navigation;

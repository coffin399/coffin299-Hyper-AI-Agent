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
} from '@mui/icons-material';

// Discord Icon Component
const DiscordIcon: React.FC<{ sx?: any }> = ({ sx }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={sx}
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

// Slack Icon Component
const SlackIcon: React.FC<{ sx?: any }> = ({ sx }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={sx}
  >
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.527 2.527 0 0 1 6.313 24a2.527 2.527 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.527 2.527 0 0 1-2.521-2.52A2.527 2.527 0 0 1 8.834 0a2.527 2.527 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.527 2.527 0 0 1 2.521 2.521 2.527 2.527 0 0 1-2.521 2.521H2.522A2.527 2.527 0 0 1 0 8.834a2.527 2.527 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521 2.528 2.528 0 0 1 2.522 2.521 2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.522 2.521 2.527 2.527 0 0 1-2.521-2.521V2.522A2.527 2.527 0 0 1 15.166 0a2.528 2.528 0 0 1 2.522 2.522v6.312zM15.166 18.956a2.528 2.528 0 0 1 2.522 2.522 2.528 2.528 0 0 1-2.522 2.522 2.527 2.527 0 0 1-2.521-2.522v-2.522h2.521zM15.166 17.688a2.527 2.527 0 0 1-2.521-2.522 2.528 2.528 0 0 1 2.521-2.522h6.313a2.528 2.528 0 0 1 2.522 2.522 2.527 2.527 0 0 1-2.522 2.521h-6.313z"/>
  </svg>
);

// LINE Icon Component
const LineIcon: React.FC<{ sx?: any }> = ({ sx }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={sx}
  >
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771z"/>
    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
    <path d="M8 13.5h2.5V15c0 .276.224.5.5.5s.5-.224.5-.5v-1.5H14c.276 0 .5-.224.5-.5s-.224-.5-.5-.5h-2.5V11c0-.276-.224-.5-.5-.5s-.5.224-.5.5v1.5H8c-.276 0-.5.224-.5.5s.224.5.5.5z"/>
  </svg>
);

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
    { id: 'discord', label: 'Discord連携', icon: <DiscordIcon sx={{ color: '#5865F2' }} /> },
    { id: 'line', label: 'LINE連携', icon: <LineIcon sx={{ color: '#00C300' }} /> },
    { id: 'slack', label: 'Slack連携', icon: <SlackIcon sx={{ color: '#4A154B' }} /> },
    { id: 'docs', label: 'AIドキュメント', icon: <Description /> },
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

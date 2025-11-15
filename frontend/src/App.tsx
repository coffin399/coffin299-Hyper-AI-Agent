import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { CssBaseline, Box } from '@mui/material';
import Navigation from './components/Navigation';
import ModernDashboard from './components/ModernDashboard';
import ModelManager from './components/ModelManager';
import GoogleConnect from './components/GoogleConnect';
import DiscordConnect from './components/DiscordConnect';
import LineConnect from './components/LineConnect';
import SlackConnect from './components/SlackConnect';
import AIDocuments from './components/AIDocuments';
import AIRoles from './components/AIRoles';
import AIMedia from './components/AIMedia';
import AIMeeting from './components/AIMeeting';
import AIChat from './components/AIChat';
import AIOCR from './components/AIOCR';
import Settings from './components/Settings';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'models':
        return <ModelManager />;
      case 'google':
        return <GoogleConnect />;
      case 'discord':
        return <DiscordConnect />;
      case 'line':
        return <LineConnect />;
      case 'slack':
        return <SlackConnect />;
      case 'docs':
        return <AIDocuments />;
      case 'roles':
        return <AIRoles />;
      case 'media':
        return <AIMedia />;
      case 'meeting':
        return <AIMeeting />;
      case 'chat':
        return <AIChat />;
      case 'ocr':
        return <AIOCR />;
      case 'settings':
        return <Settings />;
      case 'dashboard':
      default:
        return <ModernDashboard />;
    }
  };

  return (
    <ThemeProvider>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Navigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box component="main" sx={{ flexGrow: 1 }}>
            {renderContent()}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;

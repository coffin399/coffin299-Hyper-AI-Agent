import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Fab,
  Alert,
} from '@mui/material';
import {
  Search,
  Send,
  DriveFileMove,
  Email,
  CalendarToday,
  Description,
  SmartToy,
  Slideshow,
  TableChart,
  Code,
  Palette,
  ContentCut,
  Chat,
  Image,
  VideoFile,
  Note,
  Apps,
  Info,
  Star,
} from '@mui/icons-material';

interface FeatureCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const ModernDashboard: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectedGoogleService, setSelectedGoogleService] = useState<string | null>(null);

  const googleServices = [
    { id: 'gmail', name: 'Gmail', icon: <Email />, color: '#EA4335' },
    { id: 'drive', name: 'Drive', icon: <DriveFileMove />, color: '#4285F4' },
    { id: 'calendar', name: 'Calendar', icon: <CalendarToday />, color: '#34A853' },
    { id: 'docs', name: 'Docs', icon: <Description />, color: '#FBBC04' },
  ];

  const features: FeatureCard[] = [
    { id: 'custom-agent', title: 'カスタムスーパーエージェント', icon: <SmartToy />, color: '#FF6B6B', description: '独自のAIエージェントを作成' },
    { id: 'ai-slides', title: 'AIスライド', icon: <Slideshow />, color: '#4ECDC4', description: 'プレゼンテーションを自動生成' },
    { id: 'ai-sheets', title: 'AIシート', icon: <TableChart />, color: '#45B7D1', description: 'スプレッドシートを分析・作成' },
    { id: 'ai-docs', title: 'AIドキュメント', icon: <Description />, color: '#96CEB4', description: '文書を作成・要約・翻訳' },
    { id: 'ai-developer', title: 'AIデベロッパー', icon: <Code />, color: '#FFEAA7', description: 'コード生成とデバッグ支援' },
    { id: 'ai-designer', title: 'AIデザイナー', icon: <Palette />, color: '#DDA0DD', description: 'デザインと画像生成' },
    { id: 'clip-genius', title: 'クリップジーニアス', icon: <ContentCut />, color: '#98D8C8', description: '動画編集とクリップ作成' },
    { id: 'ai-chat', title: 'AIチャット', icon: <Chat />, color: '#FFB6C1', description: 'インテリジェントな会話' },
    { id: 'ai-image', title: 'AI画像 (Nano Banana)', icon: <Image />, color: '#87CEEB', description: '高品質な画像生成' },
    { id: 'ai-video', title: 'AI動画', icon: <VideoFile />, color: '#F0E68C', description: '動画生成と編集' },
    { id: 'ai-meeting', title: 'AI会議メモ', icon: <Note />, color: '#B19CD9', description: '会議内容を自動記録' },
    { id: 'all', title: 'すべて', icon: <Apps />, color: '#708090', description: '全機能へアクセス' },
  ];

  const handleSearch = () => {
    if (inputValue.trim()) {
      console.log('Searching for:', inputValue);
      // Implement search functionality
    }
  };

  const handleGoogleServiceClick = (serviceId: string) => {
    setSelectedGoogleService(serviceId === selectedGoogleService ? null : serviceId);
  };

  const handleFeatureClick = (featureId: string) => {
    console.log('Feature clicked:', featureId);
    // Navigate to specific feature
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4, color: 'white' }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Genspark スーパーエージェント
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          何でも尋ねて、何でも作成
        </Typography>
      </Box>

      {/* Main Search Input */}
      <Paper
        elevation={8}
        sx={{
          p: 2,
          mb: 4,
          width: '100%',
          maxWidth: 600,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="何でもお尋ねください..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'white',
              },
            }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
              },
            }}
            startIcon={<Send />}
          >
            リサーチミー
          </Button>
        </Box>
      </Paper>

      {/* Google Services Integration */}
      <Paper
        elevation={4}
        sx={{
          p: 3,
          mb: 4,
          width: '100%',
          maxWidth: 800,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography variant="h6" gutterBottom color="text.primary">
          Googleサービス連携
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {googleServices.map((service) => (
            <Card
              key={service.id}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: selectedGoogleService === service.id ? 2 : 1,
                borderColor: selectedGoogleService === service.id ? service.color : 'grey.300',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => handleGoogleServiceClick(service.id)}
            >
              <CardContent sx={{ textAlign: 'center', p: 2, minWidth: 100 }}>
                <Avatar sx={{ bgcolor: service.color, mx: 'auto', mb: 1 }}>
                  {service.icon}
                </Avatar>
                <Typography variant="caption">{service.name}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>

      {/* Feature Grid */}
      <Box sx={{ width: '100%', maxWidth: 1200, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'white', textAlign: 'center', mb: 3 }}>
          Gensparkは個人化されたツールをサポートします
        </Typography>
        <Grid container spacing={2} justifyContent="center">
          {features.map((feature) => (
            <Grid item xs={6} sm={4} md={3} key={feature.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    transform: 'translateY(-4px) scale(1.02)',
                    boxShadow: 6,
                  },
                }}
                onClick={() => handleFeatureClick(feature.id)}
              >
                <CardContent sx={{ p: 2 }}>
                  <Avatar sx={{ bgcolor: feature.color, mb: 1, mx: 'auto' }}>
                    {feature.icon}
                  </Avatar>
                  <Typography variant="caption" fontWeight={600}>
                    {feature.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Slack Integration Notice */}
      <Alert
        severity="info"
        sx={{
          mb: 3,
          width: '100%',
          maxWidth: 600,
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
        icon={<Info />}
      >
        <Typography variant="body2">
          GensparkがSlackで利用できるようになりました！
        </Typography>
      </Alert>

      {/* Recommended Button */}
      <Fab
        variant="extended"
        sx={{
          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
          color: 'white',
          '&:hover': {
            background: 'linear-gradient(45deg, #FF5252, #3DBDB4)',
          },
        }}
        onClick={() => console.log('Show recommendations')}
      >
        <Star sx={{ mr: 1 }} />
        おすすめ
      </Fab>
    </Box>
  );
};

export default ModernDashboard;

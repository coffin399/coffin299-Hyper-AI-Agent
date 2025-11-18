import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import { CheckCircle, Error, Link, Notifications } from '@mui/icons-material';

interface SlackConnectProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const SlackConnect: React.FC<SlackConnectProps> = ({ onConnect, onDisconnect }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate Slack OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsConnected(true);
      onConnect?.();
    } catch (err) {
      setError('Slackとの接続に失敗しました。再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    onDisconnect?.();
  };

  const features = [
    'メッセージの送受信',
    'チャンネル管理',
    'ファイル共有',
    'リアルタイム通知',
    'ワークスペース統合',
  ];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Slack連携
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Slackと連携して、AIアシスタントとのコミュニケーションを強化します。
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              component="img"
              src="/icons/Slack_logo.png"
              alt="Slack"
              sx={{ width: 32, height: 32, mr: 2, borderRadius: 1 }}
            />
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Slack Integration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isConnected ? '接続済み' : '未接続'}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              {isConnected ? (
                <Chip
                  icon={<CheckCircle />}
                  label="接続済み"
                  color="success"
                  variant="outlined"
                />
              ) : (
                <Chip
                  icon={<Error />}
                  label="未接続"
                  color="default"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom>
            利用可能な機能:
          </Typography>
          <List dense>
            {features.map((feature, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircle color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={feature} />
              </ListItem>
            ))}
          </List>

          {isConnected && (
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Notifications sx={{ mr: 1 }} fontSize="small" />
                    通知を有効にする
                  </Box>
                }
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        {!isConnected ? (
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={20} /> : <Link />}
            onClick={handleConnect}
            disabled={isLoading}
            size="large"
            sx={{
              backgroundColor: '#4A154B',
              '&:hover': {
                backgroundColor: '#3D0F2E',
              },
            }}
          >
            {isLoading ? '接続中...' : 'Slackと接続'}
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="error"
            onClick={handleDisconnect}
            size="large"
          >
            接続を解除
          </Button>
        )}
      </Box>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          <strong>注:</strong> Slack連携にはワークスペースの管理者権限が必要な場合があります。
        </Typography>
      </Box>
    </Box>
  );
};

export default SlackConnect;

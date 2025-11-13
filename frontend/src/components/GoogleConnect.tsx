import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Cloud,
  Description,
  TableChart,
  Slideshow,
  Folder,
  CheckCircle,
  Error,
  Launch,
  Refresh,
} from '@mui/icons-material';

interface GoogleFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
}

const GoogleConnect: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [clientConfigText, setClientConfigText] = useState('');
  const [authUrl, setAuthUrl] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [files, setFiles] = useState<GoogleFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/google/auth/status');
      const data = await response.json();
      setAuthStatus(data);
      setIsAuthenticated(data.authenticated);
    } catch (err) {
      setError('Failed to check auth status');
    }
  };

  const handleAuthSetup = async () => {
    try {
      const clientConfig = JSON.parse(clientConfigText);
      const response = await fetch('/api/google/auth/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_config: clientConfig }),
      });
      const data = await response.json();
      setAuthUrl(data.auth_url);
    } catch (err) {
      setError('Invalid client configuration');
    }
  };

  const handleAuthExchange = async () => {
    try {
      const clientConfig = JSON.parse(clientConfigText);
      const response = await fetch('/api/google/auth/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          client_config: clientConfig,
          code: authCode 
        }),
      });
      
      if (response.ok) {
        setAuthDialogOpen(false);
        checkAuthStatus();
        setError(null);
      } else {
        setError('Failed to authenticate');
      }
    } catch (err) {
      setError('Authentication failed');
    }
  };

  const handleRevoke = async () => {
    try {
      await fetch('/api/google/auth/revoke', { method: 'POST' });
      setIsAuthenticated(false);
      setFiles([]);
      checkAuthStatus();
    } catch (err) {
      setError('Failed to revoke authentication');
    }
  };

  const loadFiles = async () => {
    try {
      const response = await fetch(`/api/google/drive/files?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setFiles(data.files);
    } catch (err) {
      setError('Failed to load files');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('document')) return <Description />;
    if (mimeType.includes('spreadsheet')) return <TableChart />;
    if (mimeType.includes('presentation')) return <Slideshow />;
    if (mimeType.includes('folder')) return <Folder />;
    return <Description />;
  };

  const getFileType = (mimeType: string) => {
    if (mimeType.includes('document')) return 'Document';
    if (mimeType.includes('spreadsheet')) return 'Spreadsheet';
    if (mimeType.includes('presentation')) return 'Presentation';
    if (mimeType.includes('folder')) return 'Folder';
    return 'File';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Google連携
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 認証ステータス */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Cloud color={isAuthenticated ? "primary" : "disabled"} />
              <Box>
                <Typography variant="h6">
                  Google認証
                  {isAuthenticated && (
                    <Chip label="接続済み" color="success" size="small" sx={{ ml: 1 }} />
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isAuthenticated 
                    ? 'Google APIに接続されています' 
                    : 'Google APIに接続していません'}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" gap={1}>
              {isAuthenticated ? (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRevoke}
                >
                  切断
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setAuthDialogOpen(true)}
                >
                  接続
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 認証ダイアログ */}
      <Dialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Google API認証</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Google Cloud Consoleからダウンロードしたクライアント設定を貼り付けてください。
          </Typography>
          
          <TextField
            label="クライアント設定 (JSON)"
            multiline
            rows={6}
            fullWidth
            value={clientConfigText}
            onChange={(e) => setClientConfigText(e.target.value)}
            placeholder='{"installed":{"client_id":"...","client_secret":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","redirect_uris":["..."]}}'
            sx={{ mb: 2 }}
          />
          
          {authUrl && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                1. 以下のURLを開いて認証してください:
              </Typography>
              <TextField
                value={authUrl}
                fullWidth
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={() => window.open(authUrl, '_blank')}>
                      <Launch />
                    </IconButton>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="subtitle2" gutterBottom>
                2. リダイレクト後のURLから認証コードをコピーしてください:
              </Typography>
              <TextField
                label="認証コード"
                fullWidth
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="4/0AX4XfWh..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuthDialogOpen(false)}>キャンセル</Button>
          {!authUrl ? (
            <Button onClick={handleAuthSetup} variant="contained">
              認証URLを生成
            </Button>
          ) : (
            <Button onClick={handleAuthExchange} variant="contained">
              認証
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ファイル一覧 */}
      {isAuthenticated && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6">Google Drive</Typography>
              <IconButton onClick={loadFiles}>
                <Refresh />
              </IconButton>
            </Box>
            
            <TextField
              label="検索"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadFiles()}
              sx={{ mb: 2 }}
            />
            
            <Button onClick={loadFiles} variant="outlined" sx={{ mb: 2 }}>
              ファイルを読み込み
            </Button>
            
            <List>
              {files.map((file) => (
                <ListItem key={file.id}>
                  <ListItemIcon>
                    {getFileIcon(file.mimeType)}
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {getFileType(file.mimeType)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          更新: {new Date(file.modifiedTime).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <IconButton onClick={() => window.open(file.webViewLink, '_blank')}>
                    <Launch />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default GoogleConnect;

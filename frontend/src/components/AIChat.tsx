import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Grid,
  Paper,
  Drawer,
  AppBar,
  Toolbar,
  InputAdornment,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  ListItemIcon as MenuItemListItemIcon,
} from '@mui/material';
import {
  Send,
  Add,
  Delete,
  Download,
  Search,
  MoreVert,
  Refresh,
  Settings,
  History,
  Chat,
  SmartToy,
  Person,
} from '@mui/icons-material';

interface ChatSession {
  id: string;
  title: string;
  model: string;
  system_prompt: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: string;
    metadata: any;
  }>;
  created_at: string;
  updated_at: string;
}

interface AIModel {
  id: string;
  name: string;
  description: string;
}

const AIChat: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [systemPrompt, setSystemPrompt] = useState('あなたは役立つAIアシスタントです。');
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSessions();
    loadModels();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/chat/sessions');
      const data = await response.json();
      setSessions(data.sessions);
      if (data.sessions.length > 0 && !currentSession) {
        setCurrentSession(data.sessions[0]);
      }
    } catch (err) {
      setError('Failed to load sessions');
    }
  };

  const loadModels = async () => {
    try {
      const response = await fetch('/api/chat/models');
      const data = await response.json();
      setModels(data.models);
    } catch (err) {
      setError('Failed to load models');
    }
  };

  const createSession = async () => {
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSessionTitle || '新しいチャット',
          model: selectedModel,
          system_prompt: systemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      const newSession = {
        ...data.session,
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setSessions([newSession, ...sessions]);
      setCurrentSession(newSession);
      setSessionDialogOpen(false);
      setNewSessionTitle('');
    } catch (err) {
      setError('Failed to create session');
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      setSessions(sessions.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(sessions.length > 0 ? sessions[0] : null);
      }
      setAnchorEl(null);
    } catch (err) {
      setError('Failed to delete session');
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentSession) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSession.id,
          message: message.trim(),
          role: 'user',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const updatedSession = {
        ...currentSession,
        messages: [
          ...currentSession.messages,
          {
            id: Date.now().toString(),
            role: 'user',
            content: message.trim(),
            timestamp: new Date().toISOString(),
            metadata: {},
          },
          data.response.message,
        ],
        updated_at: data.response.session_updated,
      };

      setCurrentSession(updatedSession);
      setSessions(sessions.map(s => s.id === updatedSession.id ? updatedSession : s));
      setMessage('');
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const regenerateResponse = async () => {
    if (!currentSession) return;

    try {
      const response = await fetch(`/api/chat/sessions/${currentSession.id}/regenerate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate response');
      }

      const data = await response.json();
      const updatedSession = {
        ...currentSession,
        messages: data.response.message ? [
          ...currentSession.messages.slice(0, -2),
          data.response.message,
        ] : currentSession.messages,
      };

      setCurrentSession(updatedSession);
      setSessions(sessions.map(s => s.id === updatedSession.id ? updatedSession : s));
    } catch (err) {
      setError('Failed to regenerate response');
    }
  };

  const exportSession = async (format: string) => {
    if (!currentSession) return;

    try {
      const response = await fetch(`/api/chat/sessions/${currentSession.id}/export?format=${format}`);
      const data = await response.json();

      const blob = new Blob([data.data], { 
        type: format === 'json' ? 'application/json' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentSession.title}.${format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setAnchorEl(null);
    } catch (err) {
      setError('Failed to export session');
    }
  };

  const searchMessages = async () => {
    if (!currentSession || !searchQuery.trim()) return;

    try {
      const response = await fetch(
        `/api/chat/sessions/${currentSession.id}/search?query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      // 検索結果をハイライト表示（実装は省略）
      console.log('Search results:', data.results);
    } catch (err) {
      setError('Failed to search messages');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, sessionId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedSessionId(sessionId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSessionId(null);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getModelName = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    return model ? model.name : modelId;
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* サイドバー */}
      <Drawer
        variant="permanent"
        sx={{
          width: 300,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 300, boxSizing: 'border-box' },
        }}
      >
        <Toolbar>
          <Typography variant="h6">AIチャット</Typography>
        </Toolbar>
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setSessionDialogOpen(true)}
            fullWidth
          >
            新規チャット
          </Button>
        </Box>
        <List sx={{ flex: 1, overflow: 'auto' }}>
          {sessions.map((session) => (
            <ListItem
              key={session.id}
              button
              selected={currentSession?.id === session.id}
              onClick={() => setCurrentSession(session)}
              sx={{ pr: 1 }}
            >
              <ListItemIcon>
                <Chat />
              </ListItemIcon>
              <ListItemText
                primary={session.title}
                secondary={getModelName(session.model)}
                primaryTypographyProps={{ noWrap: true }}
                secondaryTypographyProps={{ noWrap: true }}
              />
              <IconButton
                size="small"
                onClick={(e) => handleMenuClick(e, session.id)}
              >
                <MoreVert />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* メインコンテンツ */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {currentSession ? (
          <>
            {/* ヘッダー */}
            <AppBar position="static" color="default" elevation={1}>
              <Toolbar>
                <Typography variant="h6" sx={{ flex: 1 }}>
                  {currentSession.title}
                </Typography>
                <Chip 
                  label={getModelName(currentSession.model)} 
                  size="small" 
                  sx={{ mr: 1 }}
                />
                <IconButton onClick={regenerateResponse} title="応答を再生成">
                  <Refresh />
                </IconButton>
                <IconButton onClick={(e) => handleMenuClick(e, currentSession.id)} title="メニュー">
                  <MoreVert />
                </IconButton>
              </Toolbar>
            </AppBar>

            {/* メッセージエリア */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {currentSession.messages.map((msg, index) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box sx={{ maxWidth: '70%' }}>
                    <Card
                      sx={{
                        bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                        color: msg.role === 'user' ? 'white' : 'text.primary',
                      }}
                    >
                      <CardContent sx={{ pb: 1 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          {msg.role === 'user' ? <Person /> : <SmartToy />}
                          <Typography variant="caption" sx={{ ml: 1 }}>
                            {formatTimestamp(msg.timestamp)}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {msg.content}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* 入力エリア */}
            <Paper sx={{ p: 2, m: 2 }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="メッセージを入力..."
                disabled={isSending}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        variant="contained"
                        endIcon={<Send />}
                        onClick={sendMessage}
                        disabled={isSending || !message.trim()}
                      >
                        送信
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </Paper>
          </>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              チャットセッションを選択してください
            </Typography>
          </Box>
        )}
      </Box>

      {/* 新規セッションダイアログ */}
      <Dialog open={sessionDialogOpen} onClose={() => setSessionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新しいチャットセッション</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="タイトル"
                fullWidth
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                placeholder="新しいチャット"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>AIモデル</InputLabel>
                <Select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {models.map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="システムプロンプト"
                multiline
                rows={3}
                fullWidth
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionDialogOpen(false)}>キャンセル</Button>
          <Button onClick={createSession} variant="contained">作成</Button>
        </DialogActions>
      </Dialog>

      {/* コンテキストメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent onClick={() => exportSession('json')}>
          <MenuItemListItemIcon><Download /></MenuItemListItemIcon>
          JSONでエクスポート
        </MenuItemComponent>
        <MenuItemComponent onClick={() => exportSession('markdown')}>
          <MenuItemListItemIcon><Download /></MenuItemListItemIcon>
          Markdownでエクスポート
        </MenuItemComponent>
        <MenuItemComponent onClick={() => exportSession('txt')}>
          <MenuItemListItemIcon><Download /></MenuItemListItemIcon>
          テキストでエクスポート
        </MenuItemComponent>
        <MenuItemComponent onClick={() => selectedSessionId && deleteSession(selectedSessionId)}>
          <MenuItemListItemIcon><Delete /></MenuItemListItemIcon>
          削除
        </MenuItemComponent>
      </Menu>
    </Box>
  );
};

export default AIChat;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Grid,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  TextField,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ChatBubble,
  Login,
  Logout,
  Send,
  Message,
  Webhook,
  Settings,
  Groups,
  Forum,
  Link,
  Refresh,
  CheckCircle,
  Error,
  ExpandMore,
} from '@mui/icons-material';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  email?: string;
  verified?: boolean;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  member_count: number;
  owner: boolean;
}

interface DiscordChannel {
  id: string;
  name: string;
  type: string;
  topic?: string;
  nsfw: boolean;
}

interface DiscordMessage {
  id: string;
  channel_id: string;
  content: string;
  timestamp: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
    bot?: boolean;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`discord-tabpanel-${index}`}
      aria-labelledby={`discord-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DiscordConnect: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentUser, setCurrentUser] = useState<DiscordUser | null>(null);
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [messages, setMessages] = useState<DiscordMessage[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // フォーム状態
  const [selectedGuild, setSelectedGuild] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookName, setWebhookName] = useState('Hyper AI Bot');
  const [useEmbed, setUseEmbed] = useState(false);
  const [embedTitle, setEmbedTitle] = useState('');
  const [embedDescription, setEmbedDescription] = useState('');

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/discord/status');
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (err) {
      console.error('Failed to check Discord status:', err);
    }
  };

  const connectToDiscord = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // OAuth URLを取得
      const oauthResponse = await fetch('/api/discord/oauth-url');
      const oauthData = await oauthResponse.json();
      
      // 新しいウィンドウでOAuth認証
      const popup = window.open(
        oauthData.oauth_url,
        'discord_oauth',
        'width=500,height=600,scrollbars=yes'
      );

      // 認証完了を待機（実際の実装ではより高度な処理が必要）
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          // 本来はここで認証コードを取得して処理
          // モック実装では直接認証成功とする
          handleAuthSuccess();
        }
      }, 1000);
    } catch (err) {
      setError('Failed to connect to Discord');
      setIsConnecting(false);
    }
  };

  const handleAuthSuccess = async () => {
    try {
      // モック認証成功
      const mockUser: DiscordUser = {
        id: '987654321098765432',
        username: 'AIUser',
        discriminator: '1234',
        avatar: 'https://cdn.discordapp.com/avatars/987654321098765432/def456.png',
        email: 'aiuser@example.com',
        verified: true
      };

      const mockToken = 'mock_access_token_12345';
      
      setCurrentUser(mockUser);
      setAccessToken(mockToken);
      setIsConnected(true);
      
      // サーバー一覧を取得
      await loadGuilds(mockToken);
    } catch (err) {
      setError('Authentication failed');
    }
  };

  const loadGuilds = async (token: string) => {
    try {
      const response = await fetch(`/api/discord/guilds/${token}`);
      const data = await response.json();
      setGuilds(data.guilds);
    } catch (err) {
      setError('Failed to load guilds');
    }
  };

  const loadChannels = async (guildId: string) => {
    try {
      const response = await fetch(`/api/discord/guilds/${guildId}/channels`);
      const data = await response.json();
      setChannels(data.channels);
    } catch (err) {
      setError('Failed to load channels');
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      const response = await fetch(`/api/discord/channels/${channelId}/messages?limit=20`);
      const data = await response.json();
      setMessages(data.messages);
    } catch (err) {
      setError('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!messageContent.trim() || !selectedChannel) {
      setError('Please select a channel and enter a message');
      return;
    }

    try {
      let embeds = null;
      if (useEmbed && embedTitle && embedDescription) {
        const embedResponse = await fetch('/api/discord/create-embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: embedTitle,
            description: embedDescription,
            color: 0x0099ff
          }),
        });
        const embedData = await embedResponse.json();
        embeds = [embedData.embed];
      }

      const response = await fetch('/api/discord/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: selectedChannel,
          content: messageContent,
          embeds: embeds,
        }),
      });

      if (!response.ok) {
        setError('Failed to send message');
        return;
      }

      const data = await response.json();
      setMessages([data.message, ...messages]);
      setMessageContent('');
      setEmbedTitle('');
      setEmbedDescription('');
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const createWebhook = async () => {
    if (!selectedChannel || !webhookName) {
      setError('Please select a channel and enter webhook name');
      return;
    }

    try {
      const response = await fetch('/api/discord/create-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: selectedChannel,
          name: webhookName,
        }),
      });

      if (!response.ok) {
        setError('Failed to create webhook');
        return;
      }

      const data = await response.json();
      setWebhookUrl(data.webhook.url);
    } catch (err) {
      setError('Failed to create webhook');
    }
  };

  const sendWebhookMessage = async () => {
    if (!messageContent.trim() || !webhookUrl) {
      setError('Please enter webhook URL and message');
      return;
    }

    try {
      const response = await fetch('/api/discord/send-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          content: messageContent,
          username: webhookName,
        }),
      });

      if (!response.ok) {
        setError('Failed to send webhook message');
        return;
      }

      setMessageContent('');
    } catch (err) {
      setError('Failed to send webhook message');
    }
  };

  const disconnect = async () => {
    if (accessToken) {
      try {
        await fetch(`/api/discord/revoke/${accessToken}`, {
          method: 'POST',
        });
      } catch (err) {
        console.error('Failed to revoke token:', err);
      }
    }

    setCurrentUser(null);
    setAccessToken(null);
    setGuilds([]);
    setChannels([]);
    setMessages([]);
    setIsConnected(false);
    setSelectedGuild('');
    setSelectedChannel('');
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ja-JP');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Discord連携
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 接続ステータス */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <ChatBubble color={isConnected ? 'primary' : 'disabled'} />
              <Typography variant="h6">
                Discord {isConnected ? '接続済み' : '未接続'}
              </Typography>
              {isConnected && currentUser && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">
                    {currentUser.username}#{currentUser.discriminator}
                  </Typography>
                  {currentUser.verified && (
                    <CheckCircle color="success" sx={{ fontSize: 16 }} />
                  )}
                </Box>
              )}
            </Box>
            <Button
              variant={isConnected ? 'outlined' : 'contained'}
              startIcon={isConnected ? <Logout /> : <Login />}
              onClick={isConnected ? disconnect : connectToDiscord}
              disabled={isConnecting}
            >
              {isConnecting ? '接続中...' : isConnected ? '切断' : '接続'}
            </Button>
          </Box>
          {isConnecting && <LinearProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>

      {isConnected && (
        <>
          {/* タブ */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab icon={<Message />} label="メッセージ送信" />
              <Tab icon={<Webhook />} label="Webhook" />
              <Tab icon={<Settings />} label="設定" />
            </Tabs>
          </Box>

          {/* メッセージ送信タブ */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>サーバーとチャンネル選択</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>サーバー</InputLabel>
                          <Select
                            value={selectedGuild}
                            onChange={(e) => {
                              setSelectedGuild(e.target.value);
                              loadChannels(e.target.value);
                            }}
                          >
                            {guilds.map((guild) => (
                              <MenuItem key={guild.id} value={guild.id}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Groups fontSize="small" />
                                  <Typography>{guild.name}</Typography>
                                  {guild.owner && (
                                    <Chip label="Owner" size="small" color="primary" />
                                  )}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>チャンネル</InputLabel>
                          <Select
                            value={selectedChannel}
                            onChange={(e) => {
                              setSelectedChannel(e.target.value);
                              loadMessages(e.target.value);
                            }}
                            disabled={!selectedGuild}
                          >
                            {channels
                              .filter(channel => channel.type === 'text')
                              .map((channel) => (
                                <MenuItem key={channel.id} value={channel.id}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Forum fontSize="small" />
                                    <Typography>#{channel.name}</Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>メッセージ作成</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="メッセージ内容"
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          placeholder="送信するメッセージを入力..."
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={useEmbed}
                              onChange={(e) => setUseEmbed(e.target.checked)}
                            />
                          }
                          label="埋め込みメッセージを使用"
                        />
                      </Grid>
                      {useEmbed && (
                        <>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="埋め込みタイトル"
                              value={embedTitle}
                              onChange={(e) => setEmbedTitle(e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              label="埋め込み説明"
                              value={embedDescription}
                              onChange={(e) => setEmbedDescription(e.target.value)}
                            />
                          </Grid>
                        </>
                      )}
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          startIcon={<Send />}
                          onClick={sendMessage}
                          disabled={!selectedChannel || !messageContent.trim()}
                          fullWidth
                        >
                          送信
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>最近のメッセージ</Typography>
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {messages.length > 0 ? (
                        <List>
                          {messages.map((message) => (
                            <ListItem key={message.id} divider>
                              <ListItemText
                                primary={
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="subtitle2">
                                      {message.author.username}
                                      {message.author.bot && (
                                        <Chip label="BOT" size="small" sx={{ ml: 1 }} />
                                      )}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {formatTimestamp(message.timestamp)}
                                    </Typography>
                                  </Box>
                                }
                                secondary={message.content}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                          メッセージがありません
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Webhookタブ */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Webhook作成</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Webhook名"
                          value={webhookName}
                          onChange={(e) => setWebhookName(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          startIcon={<Webhook />}
                          onClick={createWebhook}
                          disabled={!selectedChannel || !webhookName}
                          fullWidth
                        >
                          Webhookを作成
                        </Button>
                      </Grid>
                      {webhookUrl && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Webhook URL"
                            value={webhookUrl}
                            InputProps={{
                              readOnly: true,
                              endAdornment: (
                                <IconButton
                                  onClick={() => navigator.clipboard.writeText(webhookUrl)}
                                >
                                  <Link />
                                </IconButton>
                              ),
                            }}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Webhookメッセージ送信</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="メッセージ内容"
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          placeholder="Webhook経由で送信するメッセージを入力..."
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          startIcon={<Send />}
                          onClick={sendWebhookMessage}
                          disabled={!webhookUrl || !messageContent.trim()}
                          fullWidth
                        >
                          Webhookで送信
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* 設定タブ */}
          <TabPanel value={activeTab} index={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Discord設定</Typography>
                <Typography variant="body2" color="text.secondary">
                  Discord連携の詳細設定はこちらで行います。
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>Bot情報</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2">
                        Bot名: Hyper AI Bot<br />
                        ステータス: {isConnected ? 'オンライン' : 'オフライン'}<br />
                        権限: メッセージ送信、埋め込みメッセージ、ファイル添付
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                  
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>連携機能</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2">
                        • AI会議メモのDiscord送信<br />
                        • AIメディア生成結果の共有<br />
                        • チャットメッセージの送信<br />
                        • Webhookによる自動通知
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>
        </>
      )}
    </Box>
  );
};

export default DiscordConnect;

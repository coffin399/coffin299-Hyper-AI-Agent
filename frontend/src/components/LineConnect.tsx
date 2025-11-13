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
  Alert,
  Grid,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  TextField,
  Switch,
  FormControlLabel,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Chat,
  Login,
  Logout,
  Send,
  Message,
  Settings,
  ExpandMore,
  Group,
  CheckCircle,
  Error,
  Image,
  VideoFile,
  AudioFile,
  Campaign,
} from '@mui/icons-material';

interface LineUser {
  user_id: string;
  display_name: string;
  picture_url?: string;
  status_message?: string;
}

interface LineGroup {
  group_id: string;
  group_name: string;
  picture_url?: string;
  member_count: number;
}

interface LineMessage {
  message_id: string;
  to: string;
  message: any;
  status: string;
  timestamp: string;
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
      id={`line-tabpanel-${index}`}
      aria-labelledby={`line-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const LineConnect: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [friends, setFriends] = useState<LineUser[]>([]);
  const [groups, setGroups] = useState<LineGroup[]>([]);
  const [messages, setMessages] = useState<LineMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // フォーム状態
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [useFlex, setUseFlex] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/line/status');
      const data = await response.json();
      setIsConnected(data.connected);
      
      if (data.connected) {
        await loadFriends();
        await loadGroups();
      }
    } catch (err) {
      console.error('Failed to check LINE status:', err);
    }
  };

  const connectToLine = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // LINE連携処理（実際の実装ではLINE Developersコンソールでの設定が必要）
      await new Promise(resolve => setTimeout(resolve, 2000)); // 擬似的な接続時間
      
      setIsConnected(true);
      setIsConnecting(false);
      
      // モックデータをロード
      await loadFriends();
      await loadGroups();
    } catch (err) {
      setError('Failed to connect to LINE');
      setIsConnecting(false);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await fetch('/api/line/friends');
      const data = await response.json();
      setFriends(data.friends);
    } catch (err) {
      setError('Failed to load friends');
    }
  };

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/line/groups');
      const data = await response.json();
      setGroups(data.groups);
    } catch (err) {
      setError('Failed to load groups');
    }
  };

  const sendMessage = async () => {
    if (!messageContent.trim() || !selectedRecipient) {
      setError('Please select a recipient and enter a message');
      return;
    }

    try {
      const payload: any = {
        to: selectedRecipient,
        message_type: messageType,
        text: messageContent,
      };

      if (messageType === 'image' && imageUrl) {
        payload.image_url = imageUrl;
      } else if (messageType === 'video' && videoUrl) {
        payload.video_url = videoUrl;
      } else if (messageType === 'audio' && audioUrl) {
        payload.audio_url = audioUrl;
      }

      const response = await fetch('/api/line/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError('Failed to send message');
        return;
      }

      const data = await response.json();
      setMessages([data.message, ...messages]);
      setMessageContent('');
      setImageUrl('');
      setVideoUrl('');
      setAudioUrl('');
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const broadcastMessage = async () => {
    if (!broadcastText.trim()) {
      setError('Please enter broadcast message');
      return;
    }

    try {
      const response = await fetch('/api/line/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_type: 'text',
          text: broadcastText,
        }),
      });

      if (!response.ok) {
        setError('Failed to broadcast message');
        return;
      }

      const data = await response.json();
      setBroadcastText('');
      alert(`Broadcast sent to ${data.result.recipients} recipients`);
    } catch (err) {
      setError('Failed to broadcast message');
    }
  };

  const sendAiSummary = async () => {
    if (!selectedRecipient) {
      setError('Please select a recipient');
      return;
    }

    try {
      const response = await fetch('/api/line/send-ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedRecipient,
          title: 'AI要約テスト',
          summary: 'これはAIが生成した要約のテストです。',
          key_points: ['主要なポイント1', '主要なポイント2', '主要なポイント3'],
          use_flex: useFlex,
        }),
      });

      if (!response.ok) {
        setError('Failed to send AI summary');
        return;
      }

      const data = await response.json();
      setMessages([data.message, ...messages]);
    } catch (err) {
      setError('Failed to send AI summary');
    }
  };

  const sendMeetingMinutes = async () => {
    if (!selectedRecipient) {
      setError('Please select a recipient');
      return;
    }

    try {
      const mockMeetingData = {
        title: 'プロジェクト進捗会議',
        overview: 'プロジェクトの現状と今後の計画について議論',
        key_points: ['進捗状況の確認', '課題の特定', '次回のアクション決定'],
        action_items: [
          { description: '仕様書の更新', assignee: '田中' },
          { description: 'テスト計画の作成', assignee: '鈴木' },
        ],
        participants: ['田中', '鈴木', '佐藤'],
      };

      const response = await fetch('/api/line/send-meeting-minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedRecipient,
          meeting_data: mockMeetingData,
          use_flex: useFlex,
        }),
      });

      if (!response.ok) {
        setError('Failed to send meeting minutes');
        return;
      }

      const data = await response.json();
      setMessages([data.message, ...messages]);
    } catch (err) {
      setError('Failed to send meeting minutes');
    }
  };

  const disconnect = async () => {
    try {
      setIsConnected(false);
      setFriends([]);
      setGroups([]);
      setMessages([]);
      setSelectedRecipient('');
      setMessageContent('');
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ja-JP');
  };

  const getRecipientOptions = () => {
    const options: any[] = [];
    
    // 友達リスト
    if (friends.length > 0) {
      options.push(
        <MenuItem key="friends-header" disabled>
          <Typography variant="caption" color="text.secondary">
            ── 友達 ──
          </Typography>
        </MenuItem>
      );
      friends.forEach((friend) => (
        <MenuItem key={friend.user_id} value={friend.user_id}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar src={friend.picture_url} sx={{ width: 24, height: 24 }}>
              {friend.display_name[0]}
            </Avatar>
            <Typography variant="body2">{friend.display_name}</Typography>
          </Box>
        </MenuItem>
      ));
    }

    // グループリスト
    if (groups.length > 0) {
      options.push(
        <MenuItem key="groups-header" disabled>
          <Typography variant="caption" color="text.secondary">
            ── グループ ──
          </Typography>
        </MenuItem>
      );
      groups.forEach((group) => (
        <MenuItem key={group.group_id} value={group.group_id}>
          <Box display="flex" alignItems="center" gap={1}>
            <Group fontSize="small" color="action" />
            <Typography variant="body2">
              {group.group_name} ({group.member_count}人)
            </Typography>
          </Box>
        </MenuItem>
      ));
    }

    return options;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        LINE連携
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
              <Chat color={isConnected ? 'primary' : 'disabled'} />
              <Typography variant="h6">
                LINE {isConnected ? '接続済み' : '未接続'}
              </Typography>
              {isConnected && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">
                    友達: {friends.length}人 | グループ: {groups.length}件
                  </Typography>
                  <CheckCircle color="success" sx={{ fontSize: 16 }} />
                </Box>
              )}
            </Box>
            <Button
              variant={isConnected ? 'outlined' : 'contained'}
              startIcon={isConnected ? <Logout /> : <Login />}
              onClick={isConnected ? disconnect : connectToLine}
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
              <Tab icon={<Campaign />} label="ブロードキャスト" />
              <Tab icon={<Settings />} label="AI連携" />
            </Tabs>
          </Box>

          {/* メッセージ送信タブ */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>送信先選択</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>送信先</InputLabel>
                          <Select
                            value={selectedRecipient}
                            onChange={(e) => setSelectedRecipient(e.target.value)}
                          >
                            {getRecipientOptions()}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>メッセージタイプ</InputLabel>
                          <Select
                            value={messageType}
                            onChange={(e) => setMessageType(e.target.value)}
                          >
                            <MenuItem value="text">テキスト</MenuItem>
                            <MenuItem value="image">画像</MenuItem>
                            <MenuItem value="video">動画</MenuItem>
                            <MenuItem value="audio">音声</MenuItem>
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
                      {messageType === 'image' && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="画像URL"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                          />
                        </Grid>
                      )}
                      {messageType === 'video' && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="動画URL"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://example.com/video.mp4"
                          />
                        </Grid>
                      )}
                      {messageType === 'audio' && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="音声URL"
                            value={audioUrl}
                            onChange={(e) => setAudioUrl(e.target.value)}
                            placeholder="https://example.com/audio.mp3"
                          />
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          startIcon={<Send />}
                          onClick={sendMessage}
                          disabled={!selectedRecipient || !messageContent.trim()}
                          fullWidth
                        >
                          送信
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* ブロードキャストタブ */}
          <TabPanel value={activeTab} index={1}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>ブロードキャストメッセージ</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  全ての友達とグループに一斉送信します
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="ブロードキャストメッセージ"
                      value={broadcastText}
                      onChange={(e) => setBroadcastText(e.target.value)}
                      placeholder="全員に送信するメッセージを入力..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<Campaign />}
                      onClick={broadcastMessage}
                      disabled={!broadcastText.trim()}
                      fullWidth
                    >
                      ブロードキャスト送信
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          {/* AI連携タブ */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>AI要約送信</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={useFlex}
                          onChange={(e) => setUseFlex(e.target.checked)}
                        />
                      }
                      label="Flexメッセージを使用"
                    />
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<Send />}
                        onClick={sendAiSummary}
                        disabled={!selectedRecipient}
                        fullWidth
                      >
                        AI要約を送信
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>会議議事録送信</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={useFlex}
                          onChange={(e) => setUseFlex(e.target.checked)}
                        />
                      }
                      label="Flexメッセージを使用"
                    />
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<Send />}
                        onClick={sendMeetingMinutes}
                        disabled={!selectedRecipient}
                        fullWidth
                      >
                        会議議事録を送信
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>LINE連携設定</Typography>
                    <Typography variant="body2" color="text.secondary">
                      LINE連携の詳細設定はこちらで行います。
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
                            機能: メッセージ送信、Flexメッセージ、ブロードキャスト
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                      
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography>連携機能</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2">
                            • AI会議メモのLINE送信<br />
                            • AIメディア生成結果の共有<br />
                            • テキスト/画像/動画/音声メッセージ<br />
                            • ブロードキャスト一斉送信<br />
                            • Flexメッセージによるリッチ表示
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </>
      )}
    </Box>
  );
};

export default LineConnect;

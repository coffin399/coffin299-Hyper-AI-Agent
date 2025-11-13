import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Mic,
  Upload,
  Summarize,
  Assignment,
  PlayArrow,
  Download,
  ExpandMore,
  People,
  Schedule,
  CheckCircle,
} from '@mui/icons-material';

interface MeetingTemplate {
  id: string;
  name: string;
  description: string;
}

interface TranscriptionResult {
  transcription_id: string;
  text: string;
  language: string;
  duration: number;
  confidence: number;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

interface MeetingSummary {
  summary_id: string;
  title: string;
  overview: string;
  key_points: string[];
  action_items: Array<{
    description: string;
    assignee: string;
    priority: string;
    due_date: string;
  }>;
  decisions: string[];
  next_steps: string[];
  participants: string[];
  meeting_type: string;
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
      id={`meeting-tabpanel-${index}`}
      aria-labelledby={`meeting-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AIMeeting: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [minutes, setMinutes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォーム状態
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [meetingType, setMeetingType] = useState('general');
  const [participants, setParticipants] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('standard');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/meeting/templates');
      const data = await response.json();
      setTemplates(data.templates);
    } catch (err) {
      setError('Failed to load templates');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setError(null);
    }
  };

  const transcribeAudio = async () => {
    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', audioFile);

      // 音声ファイルをアップロード
      const uploadResponse = await fetch('/api/meeting/upload-audio', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();

      // 文字起こしを実行
      const transcriptionResponse = await fetch('/api/meeting/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_file_path: uploadData.file_path,
          language: 'ja',
        }),
      });

      if (!transcriptionResponse.ok) {
        throw new Error('Transcription failed');
      }

      const transcriptionData = await transcriptionResponse.json();
      setTranscription(transcriptionData.transcription);
    } catch (err) {
      setError('Failed to transcribe audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSummary = async () => {
    if (!transcription) {
      setError('Please transcribe audio first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const participantList = participants
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const response = await fetch('/api/meeting/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: transcription.text,
          meeting_type: meetingType,
          participants: participantList,
        }),
      });

      if (!response.ok) {
        throw new Error('Summary generation failed');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError('Failed to generate summary');
    } finally {
      setIsProcessing(false);
    }
  };

  const extractActionItems = async () => {
    if (!transcription) {
      setError('Please transcribe audio first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/meeting/extract-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: transcription.text,
        }),
      });

      if (!response.ok) {
        throw new Error('Action extraction failed');
      }

      const data = await response.json();
      if (summary) {
        setSummary({
          ...summary,
          action_items: data.action_items,
        });
      }
    } catch (err) {
      setError('Failed to extract action items');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateMinutes = async () => {
    if (!summary) {
      setError('Please generate summary first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/meeting/generate-minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_data: summary,
          template: selectedTemplate,
        }),
      });

      if (!response.ok) {
        throw new Error('Minutes generation failed');
      }

      const data = await response.json();
      setMinutes(data.minutes);
    } catch (err) {
      setError('Failed to generate minutes');
    } finally {
      setIsProcessing(false);
    }
  };

  const processCompleteMeeting = async () => {
    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('meeting_type', meetingType);
      formData.append('participants', participants);
      formData.append('template', selectedTemplate);

      const response = await fetch('/api/meeting/process-meeting', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Complete processing failed');
      }

      const data = await response.json();
      setTranscription(data.transcription);
      setSummary(data.summary);
      setMinutes(data.minutes);
    } catch (err) {
      setError('Failed to process meeting');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadMinutes = () => {
    if (!minutes) return;

    const blob = new Blob([minutes], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting_minutes_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI会議メモ
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* タブ */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<Mic />} label="音声認識" />
          <Tab icon={<Summarize />} label="要約生成" />
          <Tab icon={<Assignment />} label="議事録" />
        </Tabs>
      </Box>

      {/* 音声認識タブ */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>音声ファイルをアップロード</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<Upload />}
                      fullWidth
                    >
                      音声ファイルを選択
                      <input
                        type="file"
                        accept="audio/*"
                        hidden
                        onChange={handleFileUpload}
                      />
                    </Button>
                    {audioFile && (
                      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        選択中: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>会議タイプ</InputLabel>
                      <Select
                        value={meetingType}
                        onChange={(e) => setMeetingType(e.target.value)}
                      >
                        <MenuItem value="general">一般会議</MenuItem>
                        <MenuItem value="brainstorming">ブレインストーミング</MenuItem>
                        <MenuItem value="decision_making">意思決定</MenuItem>
                        <MenuItem value="project_update">プロジェクト進捗</MenuItem>
                        <MenuItem value="retrospective">レトロスペクティブ</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="参加者（カンマ区切り）"
                      fullWidth
                      value={participants}
                      onChange={(e) => setParticipants(e.target.value)}
                      placeholder="田中, 鈴木, 佐藤"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" gap={2}>
                      <Button
                        variant="contained"
                        startIcon={<Mic />}
                        onClick={transcribeAudio}
                        disabled={isProcessing || !audioFile}
                      >
                        {isProcessing ? '処理中...' : '文字起こし'}
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<PlayArrow />}
                        onClick={processCompleteMeeting}
                        disabled={isProcessing || !audioFile}
                      >
                        完全処理
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
                {isProcessing && <LinearProgress sx={{ mt: 2 }} />}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>文字起こし結果</Typography>
                {transcription ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      信頼度: {(transcription.confidence * 100).toFixed(1)}% | 
                      長さ: {transcription.duration}秒
                    </Typography>
                    <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                      <Typography variant="body2" component="pre">
                        {transcription.text}
                      </Typography>
                    </Paper>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    音声ファイルをアップロードして文字起こしを実行してください
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* 要約生成タブ */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>会議要約</Typography>
                <Box display="flex" gap={2} mb={2}>
                  <Button
                    variant="contained"
                    startIcon={<Summarize />}
                    onClick={generateSummary}
                    disabled={isProcessing || !transcription}
                  >
                    要約を生成
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Assignment />}
                    onClick={extractActionItems}
                    disabled={isProcessing || !transcription}
                  >
                    アクション項目抽出
                  </Button>
                </Box>
                {isProcessing && <LinearProgress sx={{ mb: 2 }} />}
                {summary && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {summary.title}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {summary.overview}
                    </Typography>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle2">主要なポイント</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {summary.key_points.map((point, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={`• ${point}`} />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>アクション項目</Typography>
                {summary?.action_items && summary.action_items.length > 0 ? (
                  <List>
                    {summary.action_items.map((item, index) => (
                      <ListItem key={index} sx={{ border: 1, borderColor: 'divider', mb: 1, borderRadius: 1 }}>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">{item.description}</Typography>
                              <Chip 
                                label={item.priority} 
                                size="small" 
                                color={getPriorityColor(item.priority) as any}
                              />
                            </Box>
                          }
                          secondary={`担当: ${item.assignee} | 期限: ${item.due_date}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    アクション項目がありません
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* 議事録タブ */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>議事録生成</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>テンプレート</InputLabel>
                      <Select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                      >
                        {templates.map((template) => (
                          <MenuItem key={template.id} value={template.id}>
                            {template.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<Assignment />}
                      onClick={generateMinutes}
                      disabled={isProcessing || !summary}
                      fullWidth
                    >
                      {isProcessing ? '生成中...' : '議事録を生成'}
                    </Button>
                  </Grid>
                </Grid>
                {isProcessing && <LinearProgress sx={{ mt: 2 }} />}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">議事録プレビュー</Typography>
                  {minutes && (
                    <IconButton onClick={downloadMinutes} color="primary">
                      <Download />
                    </IconButton>
                  )}
                </Box>
                {minutes ? (
                  <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                    <Typography variant="body2" component="pre">
                      {minutes}
                    </Typography>
                  </Paper>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    要約を生成してから議事録を作成してください
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default AIMeeting;

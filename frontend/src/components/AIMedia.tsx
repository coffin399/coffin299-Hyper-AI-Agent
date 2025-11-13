import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
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
} from '@mui/material';
import {
  Image,
  Videocam,
  Mic,
  Slideshow,
  Add,
  PlayArrow,
  Download,
  ExpandMore,
  Upload,
  Palette,
  Speed,
  RecordVoiceOver,
} from '@mui/icons-material';

interface MediaTemplate {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  description: string;
  default_size?: string;
  default_duration?: number;
  default_style?: string;
  default_voice?: string;
}

interface GeneratedMedia {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  title: string;
  created_at: string;
  metadata: any;
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
      id={`media-tabpanel-${index}`}
      aria-labelledby={`media-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AIMedia: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [templates, setTemplates] = useState<MediaTemplate[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [generatedMedia, setGeneratedMedia] = useState<GeneratedMedia[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 生成フォームの状態
  const [imageForm, setImageForm] = useState({
    prompt: '',
    style: 'realistic',
    size: '1024x1024',
    provider: 'dalle',
  });

  const [videoForm, setVideoForm] = useState({
    prompt: '',
    duration: 10,
    resolution: '720p',
    style: 'realistic',
  });

  const [audioForm, setAudioForm] = useState({
    text: '',
    voice: 'natural',
    format: 'mp3',
    background_music: false,
  });

  const [clipForm, setClipForm] = useState({
    script: '',
    duration: 30,
    aspect_ratio: '16:9',
    include_subtitles: true,
  });

  // スタイルと音声オプション
  const [imageStyles, setImageStyles] = useState<any[]>([]);
  const [videoStyles, setVideoStyles] = useState<any[]>([]);
  const [voiceOptions, setVoiceOptions] = useState<any[]>([]);

  useEffect(() => {
    loadTemplates();
    loadOptions();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/media/templates');
      const data = await response.json();
      setTemplates(data.templates);
    } catch (err) {
      setError('Failed to load templates');
    }
  };

  const loadOptions = async () => {
    try {
      const [imageRes, videoRes, voiceRes] = await Promise.all([
        fetch('/api/media/styles/image'),
        fetch('/api/media/styles/video'),
        fetch('/api/media/voices'),
      ]);

      const [imageData, videoData, voiceData] = await Promise.all([
        imageRes.json(),
        videoRes.json(),
        voiceRes.json(),
      ]);

      setImageStyles(imageData.styles);
      setVideoStyles(videoData.styles);
      setVoiceOptions(voiceData.voices);
    } catch (err) {
      setError('Failed to load options');
    }
  };

  const generateImage = async () => {
    if (!imageForm.prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/media/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageForm),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      const newMedia: GeneratedMedia = {
        id: data.image.image_id,
        url: data.image.url,
        type: 'image',
        title: imageForm.prompt.slice(0, 50),
        created_at: data.image.created_at,
        metadata: data.image.metadata,
      };

      setGeneratedMedia(prev => [newMedia, ...prev]);
      setImageForm({ ...imageForm, prompt: '' });
    } catch (err) {
      setError('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateVideo = async () => {
    if (!videoForm.prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/media/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoForm),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      const newMedia: GeneratedMedia = {
        id: data.video.video_id,
        url: data.video.url,
        type: 'video',
        title: videoForm.prompt.slice(0, 50),
        created_at: data.video.created_at,
        metadata: data.video.metadata,
      };

      setGeneratedMedia(prev => [newMedia, ...prev]);
      setVideoForm({ ...videoForm, prompt: '' });
    } catch (err) {
      setError('Failed to generate video');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAudio = async () => {
    if (!audioForm.text.trim()) {
      setError('Please enter text');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/media/generate/audio-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(audioForm),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      const newMedia: GeneratedMedia = {
        id: data.audio_clip.clip_id,
        url: data.audio_clip.url,
        type: 'audio',
        title: audioForm.text.slice(0, 50),
        created_at: data.audio_clip.created_at,
        metadata: data.audio_clip.metadata,
      };

      setGeneratedMedia(prev => [newMedia, ...prev]);
      setAudioForm({ ...audioForm, text: '' });
    } catch (err) {
      setError('Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateVideoClip = async () => {
    if (!clipForm.script.trim()) {
      setError('Please enter a script');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/media/generate/video-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clipForm),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      const newMedia: GeneratedMedia = {
        id: data.video_clip.clip_id,
        url: data.video_clip.url,
        type: 'video',
        title: clipForm.script.slice(0, 50),
        created_at: data.video_clip.created_at,
        metadata: data.video_clip.metadata,
      };

      setGeneratedMedia(prev => [newMedia, ...prev]);
      setClipForm({ ...clipForm, script: '' });
    } catch (err) {
      setError('Failed to generate video clip');
    } finally {
      setIsGenerating(false);
    }
  };

  const useTemplate = async (template: MediaTemplate) => {
    try {
      const customizations = {
        prompt: template.type === 'audio' ? 'Sample text for audio generation' : 'Sample prompt',
        style: template.default_style || 'realistic',
        size: template.default_size || '1024x1024',
        duration: template.default_duration || 10,
        voice: template.default_voice || 'natural',
      };

      const response = await fetch('/api/media/generate/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          customizations,
        }),
      });

      if (!response.ok) {
        throw new Error('Template generation failed');
      }

      const data = await response.json();
      const mediaData = data.media[Object.keys(data.media)[0]];
      
      const newMedia: GeneratedMedia = {
        id: mediaData.image_id || mediaData.video_id || mediaData.clip_id,
        url: mediaData.url,
        type: template.type,
        title: template.name,
        created_at: mediaData.created_at,
        metadata: mediaData.metadata,
      };

      setGeneratedMedia(prev => [newMedia, ...prev]);
      setTemplateDialogOpen(false);
    } catch (err) {
      setError('Failed to generate from template');
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image />;
      case 'video': return <Videocam />;
      case 'audio': return <Mic />;
      default: return <Slideshow />;
    }
  };

  const renderMediaPreview = (media: GeneratedMedia) => {
    if (media.type === 'image') {
      return (
        <CardMedia
          component="img"
          height="200"
          image={media.url}
          alt={media.title}
          sx={{ objectFit: 'cover' }}
        />
      );
    } else if (media.type === 'video') {
      return (
        <Box sx={{ position: 'relative', height: 200, bgcolor: 'grey.200' }}>
          <video
            controls
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          >
            <source src={media.url} type="video/mp4" />
          </video>
        </Box>
      );
    } else if (media.type === 'audio') {
      return (
        <Box sx={{ p: 2, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
          <audio controls style={{ width: '100%' }}>
            <source src={media.url} type="audio/mpeg" />
          </audio>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AIメディア生成
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* タブ */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<Image />} label="AI画像" />
          <Tab icon={<Videocam />} label="AI動画" />
          <Tab icon={<Mic />} label="AI音声" />
          <Tab icon={<Slideshow />} label="クリップ生成" />
        </Tabs>
      </Box>

      {/* AI画像タブ */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>画像を生成</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="プロンプト"
                      multiline
                      rows={3}
                      fullWidth
                      value={imageForm.prompt}
                      onChange={(e) => setImageForm({ ...imageForm, prompt: e.target.value })}
                      placeholder="例：夕日を背景にした美しい風景"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>スタイル</InputLabel>
                      <Select
                        value={imageForm.style}
                        onChange={(e) => setImageForm({ ...imageForm, style: e.target.value })}
                      >
                        {imageStyles.map((style) => (
                          <MenuItem key={style.id} value={style.id}>
                            {style.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>サイズ</InputLabel>
                      <Select
                        value={imageForm.size}
                        onChange={(e) => setImageForm({ ...imageForm, size: e.target.value })}
                      >
                        <MenuItem value="512x512">512x512</MenuItem>
                        <MenuItem value="1024x1024">1024x1024</MenuItem>
                        <MenuItem value="1024x1792">1024x1792</MenuItem>
                        <MenuItem value="1792x1024">1792x1024</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" gap={2}>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={generateImage}
                        disabled={isGenerating}
                      >
                        {isGenerating ? '生成中...' : '生成'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Palette />}
                        onClick={() => setTemplateDialogOpen(true)}
                      >
                        テンプレート
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
                {isGenerating && <LinearProgress sx={{ mt: 2 }} />}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>生成済み画像</Typography>
                <Grid container spacing={2}>
                  {generatedMedia.filter(m => m.type === 'image').slice(0, 4).map((media) => (
                    <Grid item xs={6} key={media.id}>
                      <Card>
                        {renderMediaPreview(media)}
                        <CardContent sx={{ p: 1 }}>
                          <Typography variant="caption" noWrap>
                            {media.title}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* AI動画タブ */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>動画を生成</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="プロンプト"
                      multiline
                      rows={3}
                      fullWidth
                      value={videoForm.prompt}
                      onChange={(e) => setVideoForm({ ...videoForm, prompt: e.target.value })}
                      placeholder="例：海辺を歩く人のシーン"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="長さ（秒）"
                      type="number"
                      fullWidth
                      value={videoForm.duration}
                      onChange={(e) => setVideoForm({ ...videoForm, duration: parseInt(e.target.value) || 10 })}
                      inputProps={{ min: 1, max: 60 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>解像度</InputLabel>
                      <Select
                        value={videoForm.resolution}
                        onChange={(e) => setVideoForm({ ...videoForm, resolution: e.target.value })}
                      >
                        <MenuItem value="480p">480p</MenuItem>
                        <MenuItem value="720p">720p</MenuItem>
                        <MenuItem value="1080p">1080p</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>スタイル</InputLabel>
                      <Select
                        value={videoForm.style}
                        onChange={(e) => setVideoForm({ ...videoForm, style: e.target.value })}
                      >
                        {videoStyles.map((style) => (
                          <MenuItem key={style.id} value={style.id}>
                            {style.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<Videocam />}
                      onClick={generateVideo}
                      disabled={isGenerating}
                      fullWidth
                    >
                      {isGenerating ? '生成中...' : '動画を生成'}
                    </Button>
                  </Grid>
                </Grid>
                {isGenerating && <LinearProgress sx={{ mt: 2 }} />}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>生成済み動画</Typography>
                <Grid container spacing={2}>
                  {generatedMedia.filter(m => m.type === 'video').slice(0, 2).map((media) => (
                    <Grid item xs={12} key={media.id}>
                      <Card>
                        {renderMediaPreview(media)}
                        <CardContent sx={{ p: 1 }}>
                          <Typography variant="caption" noWrap>
                            {media.title}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* AI音声タブ */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>音声を生成</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="テキスト"
                      multiline
                      rows={4}
                      fullWidth
                      value={audioForm.text}
                      onChange={(e) => setAudioForm({ ...audioForm, text: e.target.value })}
                      placeholder="音声化するテキストを入力してください"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>音声スタイル</InputLabel>
                      <Select
                        value={audioForm.voice}
                        onChange={(e) => setAudioForm({ ...audioForm, voice: e.target.value })}
                      >
                        {voiceOptions.map((voice) => (
                          <MenuItem key={voice.id} value={voice.id}>
                            {voice.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>フォーマット</InputLabel>
                      <Select
                        value={audioForm.format}
                        onChange={(e) => setAudioForm({ ...audioForm, format: e.target.value })}
                      >
                        <MenuItem value="mp3">MP3</MenuItem>
                        <MenuItem value="wav">WAV</MenuItem>
                        <MenuItem value="ogg">OGG</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<RecordVoiceOver />}
                      onClick={generateAudio}
                      disabled={isGenerating}
                      fullWidth
                    >
                      {isGenerating ? '生成中...' : '音声を生成'}
                    </Button>
                  </Grid>
                </Grid>
                {isGenerating && <LinearProgress sx={{ mt: 2 }} />}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>生成済み音声</Typography>
                <List>
                  {generatedMedia.filter(m => m.type === 'audio').slice(0, 3).map((media) => (
                    <ListItem key={media.id}>
                      <ListItemIcon>
                        <Mic />
                      </ListItemIcon>
                      <ListItemText
                        primary={media.title}
                        secondary={new Date(media.created_at).toLocaleString()}
                      />
                      <IconButton onClick={() => window.open(media.url, '_blank')}>
                        <PlayArrow />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* クリップ生成タブ */}
      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>動画クリップを生成</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="スクリプト"
                      multiline
                      rows={5}
                      fullWidth
                      value={clipForm.script}
                      onChange={(e) => setClipForm({ ...clipForm, script: e.target.value })}
                      placeholder="動画のシナリオやナレーションを入力してください"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="長さ（秒）"
                      type="number"
                      fullWidth
                      value={clipForm.duration}
                      onChange={(e) => setClipForm({ ...clipForm, duration: parseInt(e.target.value) || 30 })}
                      inputProps={{ min: 10, max: 120 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>アスペクト比</InputLabel>
                      <Select
                        value={clipForm.aspect_ratio}
                        onChange={(e) => setClipForm({ ...clipForm, aspect_ratio: e.target.value })}
                      >
                        <MenuItem value="16:9">16:9 (横長)</MenuItem>
                        <MenuItem value="9:16">9:16 (縦長)</MenuItem>
                        <MenuItem value="1:1">1:1 (正方形)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Button
                      variant={clipForm.include_subtitles ? "contained" : "outlined"}
                      onClick={() => setClipForm({ ...clipForm, include_subtitles: !clipForm.include_subtitles })}
                      fullWidth
                    >
                      字幕を含める
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<Slideshow />}
                      onClick={generateVideoClip}
                      disabled={isGenerating}
                      fullWidth
                    >
                      {isGenerating ? '生成中...' : 'クリップを生成'}
                    </Button>
                  </Grid>
                </Grid>
                {isGenerating && <LinearProgress sx={{ mt: 2 }} />}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>生成済みクリップ</Typography>
                <Grid container spacing={2}>
                  {generatedMedia.filter(m => m.type === 'video').slice(0, 2).map((media) => (
                    <Grid item xs={12} key={media.id}>
                      <Card>
                        {renderMediaPreview(media)}
                        <CardContent sx={{ p: 1 }}>
                          <Typography variant="caption" noWrap>
                            {media.title}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* テンプレート選択ダイアログ */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>テンプレート選択</DialogTitle>
        <DialogContent>
          <List>
            {templates.map((template) => (
              <ListItem key={template.id} button onClick={() => useTemplate(template)}>
                <ListItemIcon>
                  {getMediaIcon(template.type)}
                </ListItemIcon>
                <ListItemText
                  primary={template.name}
                  secondary={template.description}
                />
                <Chip label={template.type} size="small" />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>キャンセル</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIMedia;

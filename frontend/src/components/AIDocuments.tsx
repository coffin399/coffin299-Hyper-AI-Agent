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
} from '@mui/material';
import {
  Description,
  TableChart,
  Slideshow,
  Add,
  Launch,
  Article,
} from '@mui/icons-material';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
}

interface GeneratedDocument {
  id: string;
  title: string;
  url: string;
  type: 'document' | 'spreadsheet' | 'presentation';
  created_at: string;
}

const AIDocuments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'document' | 'spreadsheet' | 'presentation'>('document');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('professional');
  const [slideCount, setSlideCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [activeTab]);

  const loadTemplates = async () => {
    try {
      const endpoint = `/api/documents/templates/${activeTab}s`;
      const response = await fetch(endpoint);
      const data = await response.json();
      setTemplates(data.templates);
    } catch (err) {
      setError('Failed to load templates');
    }
  };

  const generateDocument = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      let endpoint, requestBody;

      switch (activeTab) {
        case 'document':
          endpoint = '/api/documents/generate/document';
          requestBody = { prompt, style };
          break;
        case 'spreadsheet':
          endpoint = '/api/documents/generate/spreadsheet';
          requestBody = { prompt, data_type: 'table' };
          break;
        case 'presentation':
          endpoint = '/api/documents/generate/presentation';
          requestBody = { prompt, slide_count: slideCount };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      const newDoc = data.document || data.spreadsheet || data.presentation;

      const generatedDoc: GeneratedDocument = {
        id: newDoc.document_id || newDoc.spreadsheet_id || newDoc.presentation_id,
        title: newDoc.title,
        url: newDoc.url,
        type: activeTab,
        created_at: new Date().toISOString(),
      };

      setGeneratedDocs(prev => [generatedDoc, ...prev]);
      setPrompt('');
    } catch (err) {
      setError('Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  const useTemplate = async (templateId: string) => {
    try {
      const response = await fetch('/api/documents/generate/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: activeTab,
          template_id: templateId,
          custom_data: { title: prompt || 'New document' },
        }),
      });

      if (!response.ok) {
        throw new Error('Template generation failed');
      }

      const data = await response.json();
      const newDoc = data.document;

      const generatedDoc: GeneratedDocument = {
        id: newDoc.document_id || newDoc.spreadsheet_id || newDoc.presentation_id,
        title: newDoc.title,
        url: newDoc.url,
        type: activeTab,
        created_at: new Date().toISOString(),
      };

      setGeneratedDocs(prev => [generatedDoc, ...prev]);
      setTemplateDialogOpen(false);
    } catch (err) {
      setError('Failed to generate from template');
    }
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'document': return <Description />;
      case 'spreadsheet': return <TableChart />;
      case 'presentation': return <Slideshow />;
      default: return <Description />;
    }
  };

  const getTabLabel = (type: string) => {
    switch (type) {
      case 'document': return 'AIドキュメント';
      case 'spreadsheet': return 'AIスプレッドシート';
      case 'presentation': return 'AIスライド';
      default: return 'Document';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AIドキュメント生成
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* タブ切り替え */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {(['document', 'spreadsheet', 'presentation'] as const).map((type) => (
            <Grid item key={type}>
              <Button
                variant={activeTab === type ? 'contained' : 'outlined'}
                startIcon={getTabIcon(type)}
                onClick={() => setActiveTab(type)}
              >
                {getTabLabel(type)}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 生成フォーム */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {getTabLabel(activeTab)}を生成
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="プロンプト"
                multiline
                rows={3}
                fullWidth
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  activeTab === 'document' 
                    ? '例：四半期営業報告書を作成してください'
                    : activeTab === 'spreadsheet'
                    ? '例：プロジェクト管理用のタスクリストを作成してください'
                    : '例：新商品発表会用のプレゼンテーションを作成してください'
                }
              />
            </Grid>

            {activeTab === 'document' && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>スタイル</InputLabel>
                  <Select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  >
                    <MenuItem value="professional">プロフェッショナル</MenuItem>
                    <MenuItem value="casual">カジュアル</MenuItem>
                    <MenuItem value="academic">学術的</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {activeTab === 'presentation' && (
              <Grid item xs={12} md={6}>
                <TextField
                  label="スライド枚数"
                  type="number"
                  fullWidth
                  value={slideCount}
                  onChange={(e) => setSlideCount(parseInt(e.target.value) || 5)}
                  inputProps={{ min: 1, max: 20 }}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={generateDocument}
                  disabled={isGenerating}
                >
                  {isGenerating ? '生成中...' : '生成'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Article />}
                  onClick={() => setTemplateDialogOpen(true)}
                >
                  テンプレートから生成
                </Button>
              </Box>
            </Grid>
          </Grid>

          {isGenerating && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                AIがドキュメントを生成しています...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 生成済みドキュメント一覧 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            生成済みドキュメント
          </Typography>

          {generatedDocs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              まだドキュメントが生成されていません
            </Typography>
          ) : (
            <List>
              {generatedDocs.map((doc) => (
                <ListItem key={doc.id}>
                  <ListItemIcon>
                    {getTabIcon(doc.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={doc.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {getTabLabel(doc.type)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          作成: {new Date(doc.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <IconButton onClick={() => window.open(doc.url, '_blank')}>
                    <Launch />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* テンプレート選択ダイアログ */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>テンプレート選択</DialogTitle>
        <DialogContent>
          <List>
            {templates.map((template) => (
              <ListItem key={template.id} button onClick={() => useTemplate(template.id)}>
                <ListItemText
                  primary={template.name}
                  secondary={template.description}
                />
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

export default AIDocuments;

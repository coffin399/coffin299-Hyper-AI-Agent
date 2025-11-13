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
  Switch,
  FormControlLabel,
  TextField,
} from '@mui/material';
import {
  Upload,
  Image,
  PictureAsPdf,
  Description,
  TextFields,
  TableChart,
  Download,
  ExpandMore,
  Settings,
  Search,
  Visibility,
} from '@mui/icons-material';

interface Language {
  code: string;
  name: string;
  family: string;
}

interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  processing_time: number;
  blocks?: Array<{
    type: string;
    text: string;
    confidence: number;
  }>;
  pages?: number[];
  total_pages?: number;
  metadata?: any;
}

interface StructuredData {
  extraction_type: string;
  data: any;
  confidence: number;
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
      id={`ocr-tabpanel-${index}`}
      aria-labelledby={`ocr-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AIOCR: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [structuredData, setStructuredData] = useState<StructuredData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ファイル状態
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'document'>('image');
  const [selectedLanguage, setSelectedLanguage] = useState('jpn');
  const [preprocess, setPreprocess] = useState(true);
  const [extractStructured, setExtractStructured] = useState(false);
  const [extractionType, setExtractionType] = useState('general');
  const [tableFormat, setTableFormat] = useState('csv');

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const response = await fetch('/api/ocr/languages');
      const data = await response.json();
      setLanguages(data.languages);
    } catch (err) {
      setError('Failed to load languages');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // ファイルタイプを判定
      if (file.type.startsWith('image/')) {
        setFileType('image');
      } else if (file.type === 'application/pdf') {
        setFileType('pdf');
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'text/plain'
      ) {
        setFileType('document');
      }
      
      setError(null);
    }
  };

  const performOCR = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('language', selectedLanguage);
      formData.append('extract_structured', extractStructured.toString());
      formData.append('extraction_type', extractionType);
      formData.append('preprocess', preprocess.toString());

      let endpoint = '';
      if (fileType === 'image') {
        endpoint = '/api/ocr/complete-ocr';
      } else if (fileType === 'pdf') {
        endpoint = '/api/ocr/complete-ocr';
      } else {
        endpoint = '/api/ocr/complete-ocr';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('OCR processing failed');
      }

      const data = await response.json();
      setOcrResult(data.ocr_result);
      if (data.structured_data) {
        setStructuredData({
          extraction_type: extractionType,
          data: data.structured_data,
          confidence: 0.85,
        });
      }
    } catch (err) {
      setError('Failed to process OCR');
    } finally {
      setIsProcessing(false);
    }
  };

  const extractTableData = async () => {
    if (!selectedFile || fileType !== 'image') {
      setError('Please select an image file for table extraction');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // まず画像をアップロード
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);

      const uploadResponse = await fetch('/api/ocr/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();

      // 表データを抽出
      const extractResponse = await fetch('/api/ocr/table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_path: uploadData.file_path,
          table_format: tableFormat,
        }),
      });

      if (!extractResponse.ok) {
        throw new Error('Table extraction failed');
      }

      const extractData = await extractResponse.json();
      setStructuredData({
        extraction_type: 'table',
        data: extractData.result.tables,
        confidence: extractData.result.confidence,
      });
    } catch (err) {
      setError('Failed to extract table data');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = (format: string) => {
    if (!ocrResult) return;

    let content = '';
    let filename = '';
    let mimeType = 'text/plain';

    if (format === 'txt') {
      content = ocrResult.text;
      filename = 'ocr_result.txt';
    } else if (format === 'json') {
      content = JSON.stringify(ocrResult, null, 2);
      filename = 'ocr_result.json';
      mimeType = 'application/json';
    } else if (format === 'csv' && structuredData?.extraction_type === 'table') {
      content = structuredData.data[0].data;
      filename = 'table_data.csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'image': return <Image />;
      case 'pdf': return <PictureAsPdf />;
      case 'document': return <Description />;
      default: return <Description />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'error';
  };

  const renderStructuredData = () => {
    if (!structuredData) return null;

    if (structuredData.extraction_type === 'table') {
      return (
        <Box>
          <Typography variant="subtitle2" gutterBottom>抽出された表データ</Typography>
          {structuredData.data.map((table: any, index: number) => (
            <Paper key={index} sx={{ p: 2, mb: 2 }}>
              <Typography variant="body2" component="pre">
                {typeof table.data === 'string' ? table.data : JSON.stringify(table.data, null, 2)}
              </Typography>
            </Paper>
          ))}
        </Box>
      );
    } else if (structuredData.extraction_type === 'invoice') {
      return (
        <Box>
          <Typography variant="subtitle2" gutterBottom>請求書情報</Typography>
          <Grid container spacing={2}>
            {Object.entries(structuredData.data).map(([key, value]) => (
              <Grid item xs={12} md={6} key={key}>
                <Typography variant="body2" color="text.secondary">
                  {key}:
                </Typography>
                <Typography variant="body1">
                  {String(value)}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      );
    } else if (structuredData.extraction_type === 'business_card') {
      return (
        <Box>
          <Typography variant="subtitle2" gutterBottom>名刺情報</Typography>
          <Grid container spacing={2}>
            {Object.entries(structuredData.data).map(([key, value]) => (
              <Grid item xs={12} md={6} key={key}>
                <Typography variant="body2" color="text.secondary">
                  {key}:
                </Typography>
                <Typography variant="body1">
                  {String(value)}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      );
    } else {
      return (
        <Box>
          <Typography variant="subtitle2" gutterBottom>抽出データ</Typography>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" component="pre">
              {JSON.stringify(structuredData.data, null, 2)}
            </Typography>
          </Paper>
        </Box>
      );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI OCR
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* タブ */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<TextFields />} label="テキスト抽出" />
          <Tab icon={<TableChart />} label="表データ抽出" />
        </Tabs>
      </Box>

      {/* テキスト抽出タブ */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>ファイルアップロード</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<Upload />}
                      fullWidth
                    >
                      ファイルを選択
                      <input
                        type="file"
                        accept="image/*,.pdf,.docx,.txt"
                        hidden
                        onChange={handleFileUpload}
                      />
                    </Button>
                    {selectedFile && (
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getFileIcon()}
                        <Typography variant="body2">
                          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </Typography>
                        <Chip label={fileType} size="small" />
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>言語</InputLabel>
                      <Select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                      >
                        {languages.map((lang) => (
                          <MenuItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>抽出タイプ</InputLabel>
                      <Select
                        value={extractionType}
                        onChange={(e) => setExtractionType(e.target.value)}
                      >
                        <MenuItem value="general">一般テキスト</MenuItem>
                        <MenuItem value="invoice">請求書</MenuItem>
                        <MenuItem value="business_card">名刺</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preprocess}
                          onChange={(e) => setPreprocess(e.target.checked)}
                        />
                      }
                      label="前処理を実行"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={extractStructured}
                          onChange={(e) => setExtractStructured(e.target.checked)}
                        />
                      }
                      label="構造化データを抽出"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<TextFields />}
                      onClick={performOCR}
                      disabled={isProcessing || !selectedFile}
                      fullWidth
                    >
                      {isProcessing ? '処理中...' : 'テキストを抽出'}
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
                <Typography variant="h6" gutterBottom>抽出結果</Typography>
                {ocrResult ? (
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        信頼度:
                      </Typography>
                      <Chip 
                        label={`${(ocrResult.confidence * 100).toFixed(1)}%`}
                        size="small"
                        color={getConfidenceColor(ocrResult.confidence) as any}
                      />
                      <Typography variant="body2" color="text.secondary">
                        処理時間: {ocrResult.processing_time}秒
                      </Typography>
                    </Box>
                    <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                      <Typography variant="body2" component="pre">
                        {ocrResult.text}
                      </Typography>
                    </Paper>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<Download />}
                        onClick={() => downloadResult('txt')}
                      >
                        TXT
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Download />}
                        onClick={() => downloadResult('json')}
                      >
                        JSON
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    ファイルをアップロードしてテキスト抽出を実行してください
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          {structuredData && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>構造化データ</Typography>
                  {renderStructuredData()}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* 表データ抽出タブ */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>表データ抽出</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<Upload />}
                      fullWidth
                    >
                      画像ファイルを選択
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleFileUpload}
                      />
                    </Button>
                    {selectedFile && (
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Image />
                        <Typography variant="body2">
                          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>出力フォーマット</InputLabel>
                      <Select
                        value={tableFormat}
                        onChange={(e) => setTableFormat(e.target.value)}
                      >
                        <MenuItem value="csv">CSV</MenuItem>
                        <MenuItem value="json">JSON</MenuItem>
                        <MenuItem value="list">リスト</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<TableChart />}
                      onClick={extractTableData}
                      disabled={isProcessing || !selectedFile}
                      fullWidth
                    >
                      {isProcessing ? '処理中...' : '表データを抽出'}
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
                <Typography variant="h6" gutterBottom>抽出結果</Typography>
                {structuredData?.extraction_type === 'table' ? (
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        信頼度:
                      </Typography>
                      <Chip 
                        label={`${(structuredData.confidence * 100).toFixed(1)}%`}
                        size="small"
                        color={getConfidenceColor(structuredData.confidence) as any}
                      />
                    </Box>
                    {renderStructuredData()}
                    <Box sx={{ mt: 2 }}>
                      <Button
                        size="small"
                        startIcon={<Download />}
                        onClick={() => downloadResult('csv')}
                      >
                        CSVでダウンロード
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    画像ファイルをアップロードして表データ抽出を実行してください
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

export default AIOCR;

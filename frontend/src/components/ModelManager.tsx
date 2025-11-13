import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Download,
  Delete,
  CheckCircle,
  Error as ErrorIcon,
  ExpandMore,
  ExpandLess,
  Memory,
  Computer,
} from '@mui/icons-material';

interface ModelConfig {
  description: string;
  min_ram_gb: number;
  models: ModelInfo[];
}

interface ModelInfo {
  config_key: string;
  model: string;
  quantization: string;
  size_gb: number;
  description: string;
  path?: string;
}

interface SystemInfo {
  platform: string;
  ram_gb: number;
  recommended_config: string;
}

const ModelManager: React.FC = () => {
  const [configs, setConfigs] = useState<Record<string, ModelConfig>>({});
  const [downloadedModels, setDownloadedModels] = useState<ModelInfo[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [downloading, setDownloading] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
    fetchDownloadedModels();
    fetchSystemInfo();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/models/configs');
      const data = await response.json();
      setConfigs(data);
    } catch (err) {
      setError('Failed to fetch model configurations');
    }
  };

  const fetchDownloadedModels = async () => {
    try {
      const response = await fetch('/api/models/downloaded');
      const data = await response.json();
      setDownloadedModels(data);
    } catch (err) {
      setError('Failed to fetch downloaded models');
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch('/api/models/system-info');
      const data = await response.json();
      setSystemInfo(data);
    } catch (err) {
      setError('Failed to fetch system information');
    }
  };

  const downloadModel = async (model: string, quantization: string) => {
    const modelKey = `${model}:${quantization}`;
    setDownloading({ ...downloading, [modelKey]: 'starting' });

    try {
      const response = await fetch('/api/models/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, quantization }),
      });

      if (!response.ok) {
        throw new Error('Failed to start download');
      }

      // ポーリングで進捗を確認
      const pollProgress = setInterval(async () => {
        try {
          const progressResponse = await fetch(`/api/models/progress/${modelKey}`);
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            setDownloading(prev => ({ ...prev, [modelKey]: progressData.progress }));

            if (progressData.progress === 'completed' || progressData.progress.startsWith('error')) {
              clearInterval(pollProgress);
              fetchDownloadedModels();
              if (progressData.progress === 'completed') {
                setDownloading(prev => {
                  const newDownloading = { ...prev };
                  delete newDownloading[modelKey];
                  return newDownloading;
                });
              }
            }
          }
        } catch (err) {
          clearInterval(pollProgress);
        }
      }, 1000);

    } catch (err) {
      setDownloading(prev => ({ ...prev, [modelKey]: 'error: Failed to start download' }));
      setError('Failed to start model download');
    }
  };

  const deleteModel = async (model: string, quantization: string) => {
    try {
      const response = await fetch('/api/models/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, quantization }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete model');
      }

      fetchDownloadedModels();
    } catch (err) {
      setError('Failed to delete model');
    }
  };

  const isModelDownloaded = (model: string, quantization: string): boolean => {
    return downloadedModels.some(m => m.model === model && m.quantization === quantization);
  };

  const getDownloadProgress = (model: string, quantization: string): string | null => {
    const modelKey = `${model}:${quantization}`;
    return downloading[modelKey] || null;
  };

  const toggleExpanded = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isRecommended = (configKey: string): boolean => {
    return systemInfo?.recommended_config === configKey;
  };

  const isSystemCompatible = (minRamGb: number): boolean => {
    return (systemInfo?.ram_gb || 0) >= minRamGb;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ローカルモデル管理
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {systemInfo && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Computer color="primary" />
              <Box>
                <Typography variant="h6">システム情報</Typography>
                <Typography variant="body2" color="text.secondary">
                  プラットフォーム: {systemInfo.platform} | 
                  RAM: {systemInfo.ram_gb}GB | 
                  推奨設定: {configs[systemInfo.recommended_config]?.description}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {Object.entries(configs).map(([configKey, config]) => (
        <Card key={configKey} sx={{ mb: 2 }}>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{ cursor: 'pointer' }}
              onClick={() => toggleExpanded(configKey)}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Memory color={isRecommended(configKey) ? "primary" : "disabled"} />
                <Box>
                  <Typography variant="h6">
                    {config.description}
                    {isRecommended(configKey) && (
                      <Chip label="推奨" size="small" color="primary" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    最小RAM: {config.min_ram_gb}GB
                    {!isSystemCompatible(config.min_ram_gb) && (
                      <Chip label="システム要件を満たしていません" size="small" color="error" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                </Box>
              </Box>
              <IconButton>
                {expanded[configKey] ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Collapse in={expanded[configKey]}>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {config.models.map((model) => {
                  const isDownloaded = isModelDownloaded(model.model, model.quantization);
                  const progress = getDownloadProgress(model.model, model.quantization);
                  const isCompatible = isSystemCompatible(config.min_ram_gb);

                  return (
                    <Grid item xs={12} md={6} key={`${model.model}-${model.quantization}`}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box flex={1}>
                              <Typography variant="subtitle1">
                                {model.model}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {model.description}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                量子化: {model.quantization} | サイズ: {model.size_gb}GB
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              {isDownloaded && <CheckCircle color="success" />}
                              {progress && progress.startsWith('error') && <ErrorIcon color="error" />}
                            </Box>
                          </Box>

                          {progress && !progress.startsWith('error') && progress !== 'completed' && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                ダウンロード中: {progress}
                              </Typography>
                              <LinearProgress sx={{ mt: 0.5 }} />
                            </Box>
                          )}

                          {progress && progress.startsWith('error') && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              {progress.replace('error: ', '')}
                            </Alert>
                          )}

                          <Box sx={{ mt: 2 }}>
                            {isDownloaded ? (
                              <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Delete />}
                                onClick={() => deleteModel(model.model, model.quantization)}
                                disabled={!!progress}
                              >
                                削除
                              </Button>
                            ) : (
                              <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={() => downloadModel(model.model, model.quantization)}
                                disabled={!!progress || !isCompatible}
                              >
                                ダウンロード
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Collapse>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ModelManager;

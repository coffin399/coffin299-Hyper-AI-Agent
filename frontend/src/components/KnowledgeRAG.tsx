import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  LinearProgress,
  Chip,
  Stack,
} from '@mui/material';

interface IngestedMemory {
  id: number;
  content: string;
  created_at: string;
}

const KnowledgeRAG: React.FC = () => {
  const [projectId, setProjectId] = useState<string>('1');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [memories, setMemories] = useState<IngestedMemory[]>([]);

  const handleAddTags = () => {
    const parts = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (parts.length === 0) return;
    setTags((prev) => Array.from(new Set([...prev, ...parts])));
    setTagInput('');
  };

  const handleDeleteTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = event.target.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    setError(null);
    setSuccessMessage(null);

    const trimmedProjectId = projectId.trim();
    if (!trimmedProjectId) {
      setError('project_id を入力してください');
      return;
    }
    if (!file) {
      setError('アップロードするファイルを選択してください');
      return;
    }

    setIsUploading(true);

    try {
      const query = new URLSearchParams();
      query.append('project_id', trimmedProjectId);
      tags.forEach((tag) => query.append('tags', tag));

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/memories/ingest-file?${query.toString()}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const detail = data?.detail || 'アップロードに失敗しました';
        throw new Error(detail);
      }

      const data = await response.json();
      const created: IngestedMemory[] = (data || []).map((record: any) => ({
        id: record.id,
        content: record.content,
        created_at: record.created_at,
      }));

      setMemories((prev) => [...created, ...prev]);
      setSuccessMessage(`${created.length} 件のナレッジを登録しました`);
    } catch (err: any) {
      setError(err?.message || 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ナレッジRAG
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ドキュメントをアップロードしてナレッジに登録
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="project_id"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              sx={{ maxWidth: 240 }}
            />

            <Box>
              <TextField
                label="タグ (カンマ区切り)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTags();
                  }
                }}
                sx={{ maxWidth: 360, mr: 2 }}
              />
              <Button variant="outlined" onClick={handleAddTags}>
                タグ追加
              </Button>
            </Box>

            {tags.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {tags.map((tag) => (
                  <Chip key={tag} label={tag} onDelete={() => handleDeleteTag(tag)} />
                ))}
              </Stack>
            )}

            <Button variant="outlined" component="label" sx={{ alignSelf: 'flex-start' }}>
              ファイルを選択
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
            {file && (
              <Typography variant="body2" color="text.secondary">
                選択中: {file.name}
              </Typography>
            )}

            <Box>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? 'アップロード中...' : 'ナレッジに登録'}
              </Button>
            </Box>

            {isUploading && (
              <Box sx={{ mt: 1 }}>
                <LinearProgress />
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {memories.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              直近で登録されたナレッジ
            </Typography>
            {memories.map((m) => (
              <Box key={m.id} sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  ID: {m.id} / {new Date(m.created_at).toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {m.content}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default KnowledgeRAG;

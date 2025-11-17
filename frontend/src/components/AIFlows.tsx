import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import {
  Add,
  Delete,
  PlayArrow,
  Save,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import ReactFlow, { Background, Controls, MiniMap, Node as FlowNodeType, Edge as FlowEdgeType } from 'reactflow';
import 'reactflow/dist/style.css';

interface Workflow {
  id: number;
  project_id: number;
  name: string;
  description?: string | null;
  graph: any;
}

type NodeType = 'llm' | 'tool' | 'http' | 'wait' | 'python' | 'javascript';

interface FlowNode {
  id: string;
  type: NodeType;
  label: string;
  config: any;
}

interface RunResult {
  workflow_id: number;
  success: boolean;
  error?: string | null;
  node_results: Record<string, any>;
  last_output: any;
}

const DEFAULT_PROJECT_NAME = 'Default Workflow Project';

const AIFlows: React.FC = () => {
  const [projectId, setProjectId] = useState<number | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [inputJson, setInputJson] = useState<string>('{}');
  const [mode, setMode] = useState<'list' | 'canvas'>('list');

  const selectedWorkflow = useMemo(
    () => workflows.find(w => w.id === selectedWorkflowId) || null,
    [workflows, selectedWorkflowId]
  );

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // Ensure default project exists
        const projectRes = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: DEFAULT_PROJECT_NAME,
            description: 'Auto-created project for workflow editor',
          }),
        });
        if (!projectRes.ok) {
          throw new Error('プロジェクトの初期化に失敗しました');
        }
        const projectData = await projectRes.json();
        const pid = projectData.id as number;
        setProjectId(pid);

        // Load workflows for this project
        const wfRes = await fetch(`/api/workflows?project_id=${pid}`);
        if (!wfRes.ok) {
          throw new Error('フローの読み込みに失敗しました');
        }
        const wfData: Workflow[] = await wfRes.json();
        setWorkflows(wfData);
        if (wfData.length > 0) {
          const first = wfData[0];
          setSelectedWorkflowId(first.id);
          loadWorkflowToForm(first);
        } else {
          // No workflows yet – prepare empty state
          clearForm();
        }
      } catch (e: any) {
        setError(e.message || '初期化に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const clearForm = () => {
    setName('新しいフロー');
    setDescription('');
    setNodes([]);
    setRunResult(null);
    setInputJson('{}');
  };

  const loadWorkflowToForm = (wf: Workflow) => {
    setName(wf.name);
    setDescription(wf.description || '');
    const graph = wf.graph || {};
    const graphNodes: FlowNode[] = (graph.nodes || []).map((n: any, idx: number) => ({
      id: String(n.id ?? `node-${idx + 1}`),
      type: (n.type || 'llm') as NodeType,
      label: n.label || `ステップ ${idx + 1}`,
      config: n.config || {},
    }));
    setNodes(graphNodes);
    setRunResult(null);
  };

  const handleSelectWorkflow = (wf: Workflow) => {
    setSelectedWorkflowId(wf.id);
    loadWorkflowToForm(wf);
  };

  const handleAddNode = () => {
    const nextIndex = nodes.length + 1;
    const newNode: FlowNode = {
      id: `node-${nextIndex}`,
      type: 'llm',
      label: `ステップ ${nextIndex}`,
      config: {
        provider: 'openai',
        model_name: 'gpt-4o',
        system_prompt: 'あなたは役立つAIアシスタントです。',
        prompt: '',
      },
    };
    setNodes([...nodes, newNode]);
  };

  const handleDeleteNode = (index: number) => {
    const updated = [...nodes];
    updated.splice(index, 1);
    setNodes(updated);
  };

  const moveNode = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= nodes.length) return;
    const updated = [...nodes];
    const [removed] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, removed);
    setNodes(updated);
  };

  const updateNode = (index: number, changes: Partial<FlowNode>) => {
    const updated = [...nodes];
    updated[index] = { ...updated[index], ...changes };
    setNodes(updated);
  };

  const updateNodeConfig = (index: number, configChanges: any) => {
    const updated = [...nodes];
    updated[index] = {
      ...updated[index],
      config: { ...updated[index].config, ...configChanges },
    };
    setNodes(updated);
  };

  const buildGraph = () => {
    const graphNodes = nodes.map((n) => ({
      id: n.id,
      type: n.type,
      label: n.label,
      config: n.config,
    }));
    const edges = nodes
      .map((n, idx) => {
        const next = nodes[idx + 1];
        if (!next) return null;
        return {
          id: `e-${n.id}-${next.id}`,
          source: n.id,
          target: next.id,
        };
      })
      .filter(Boolean);

    return {
      version: 1,
      entrypoint: nodes[0]?.id || null,
      nodes: graphNodes,
      edges,
    };
  };

  const handleCreateWorkflow = async () => {
    if (!projectId) return;
    try {
      setSaving(true);
      setError(null);
      const graph = buildGraph();
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name: name || '新しいフロー',
          description,
          graph,
        }),
      });
      if (!res.ok) {
        throw new Error('フローの作成に失敗しました');
      }
      const wf: Workflow = await res.json();
      setWorkflows([wf, ...workflows]);
      setSelectedWorkflowId(wf.id);
    } catch (e: any) {
      setError(e.message || 'フローの作成に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkflow = async () => {
    if (!selectedWorkflow) {
      await handleCreateWorkflow();
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const graph = buildGraph();
      const res = await fetch(`/api/workflows/${selectedWorkflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          graph,
        }),
      });
      if (!res.ok) {
        throw new Error('フローの保存に失敗しました');
      }
      const wf: Workflow = await res.json();
      setWorkflows(workflows.map(w => (w.id === wf.id ? wf : w)));
      setSelectedWorkflowId(wf.id);
    } catch (e: any) {
      setError(e.message || 'フローの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleRunWorkflow = async () => {
    if (!selectedWorkflow) {
      setError('先にフローを保存してください');
      return;
    }
    let input: any = {};
    try {
      input = inputJson.trim() ? JSON.parse(inputJson) : {};
    } catch (e) {
      setError('入力JSONの形式が正しくありません');
      return;
    }
    try {
      setRunning(true);
      setError(null);
      const res = await fetch(`/api/workflows/${selectedWorkflow.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'フローの実行に失敗しました');
      }
      const data: RunResult = await res.json();
      setRunResult(data);
    } catch (e: any) {
      setError(e.message || 'フローの実行に失敗しました');
    } finally {
      setRunning(false);
    }
  };

  const renderNodeConfig = (node: FlowNode, index: number) => {
    if (node.type === 'llm') {
      return (
        <Stack spacing={1} sx={{ mt: 1 }}>
          <TextField
            label="システムメッセージ"
            fullWidth
            size="small"
            value={node.config.system_prompt || ''}
            onChange={(e) => updateNodeConfig(index, { system_prompt: e.target.value })}
          />
          <TextField
            label="プロンプト（テンプレート）"
            fullWidth
            multiline
            minRows={2}
            value={node.config.prompt || ''}
            onChange={(e) => updateNodeConfig(index, { prompt: e.target.value })}
          />
        </Stack>
      );
    }
    if (node.type === 'tool') {
      return (
        <Stack spacing={1} sx={{ mt: 1 }}>
          <TextField
            label="ツール名"
            fullWidth
            size="small"
            value={node.config.tool_name || ''}
            onChange={(e) => updateNodeConfig(index, { tool_name: e.target.value })}
            helperText="例: filesystem_read, send_email など"
          />
        </Stack>
      );
    }
    if (node.type === 'http') {
      return (
        <Stack spacing={1} sx={{ mt: 1 }}>
          <TextField
            label="URL"
            fullWidth
            size="small"
            value={node.config.url || ''}
            onChange={(e) => updateNodeConfig(index, { url: e.target.value })}
          />
          <TextField
            label="HTTPメソッド"
            fullWidth
            size="small"
            value={node.config.method || 'GET'}
            onChange={(e) => updateNodeConfig(index, { method: e.target.value })}
          />
        </Stack>
      );
    }
    if (node.type === 'wait') {
      return (
        <Stack spacing={1} sx={{ mt: 1 }}>
          <TextField
            label="待機秒数"
            fullWidth
            size="small"
            type="number"
            value={node.config.seconds ?? 1}
            onChange={(e) => updateNodeConfig(index, { seconds: Number(e.target.value) || 0 })}
          />
        </Stack>
      );
    }
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        このステップタイプの詳細設定は今後サポート予定です。
      </Typography>
    );
  };

  const canvasNodes: FlowNodeType[] = useMemo(
    () =>
      nodes.map((n, idx) => ({
        id: n.id,
        data: { label: `${idx + 1}. ${n.label || `ステップ ${idx + 1}`}` },
        position: { x: idx * 220, y: 0 },
        type: 'default',
      })),
    [nodes]
  );

  const canvasEdges: FlowEdgeType[] = useMemo(
    () =>
      nodes
        .map((n, idx) => {
          const next = nodes[idx + 1];
          if (!next) return null;
          return {
            id: `e-${n.id}-${next.id}`,
            source: n.id,
            target: next.id,
          } as FlowEdgeType;
        })
        .filter((e): e is FlowEdgeType => Boolean(e)),
    [nodes]
  );

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* 左: フロー一覧 */}
      <Box sx={{ width: 280, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">自動フロー</Typography>
          <IconButton size="small" onClick={handleCreateWorkflow} disabled={saving || !projectId}>
            <Add />
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ flex: 1, overflow: 'auto' }}>
          {workflows.map((wf) => (
            <ListItem key={wf.id} disablePadding>
              <ListItemButton
                selected={wf.id === selectedWorkflowId}
                onClick={() => handleSelectWorkflow(wf)}
              >
                <ListItemText
                  primary={wf.name}
                  secondary={wf.description || undefined}
                  primaryTypographyProps={{ noWrap: true }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          {workflows.length === 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                まだフローがありません。「+」ボタンから作成できます。
              </Typography>
            </Box>
          )}
        </List>
      </Box>

      {/* 右: 編集エリア */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ px: 3, pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label="フロー名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveWorkflow}
            disabled={saving || !projectId}
          >
            保存
          </Button>
          <Button
            variant="outlined"
            startIcon={<PlayArrow />}
            onClick={handleRunWorkflow}
            disabled={running || !selectedWorkflow}
          >
            テスト実行
          </Button>
        </Box>

        <Box sx={{ px: 3, pb: 1 }}>
          <TextField
            label="説明 (任意)"
            fullWidth
            size="small"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Box>

        <Box sx={{ px: 3 }}>
          <Tabs
            value={mode}
            onChange={(_, v) => setMode(v)}
            sx={{ mb: 1 }}
          >
            <Tab value="list" label="リストモード" />
            <Tab value="canvas" label="キャンバスモード" />
          </Tabs>
        </Box>
        {mode === 'list' && (
          /* ステップ一覧（リストモード） */
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            <Stack spacing={2}>
              {nodes.map((node, index) => (
                <Card key={node.id} variant="outlined">
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip size="small" label={`ステップ ${index + 1}`} />
                        <TextField
                          value={node.label}
                          onChange={(e) => updateNode(index, { label: e.target.value })}
                          variant="standard"
                          placeholder="ステップ名"
                          sx={{ minWidth: 160 }}
                        />
                      </Box>
                    }
                    action={
                      <Box>
                        <IconButton size="small" onClick={() => moveNode(index, -1)} disabled={index === 0}>
                          <ArrowUpward fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => moveNode(index, 1)}
                          disabled={index === nodes.length - 1}
                        >
                          <ArrowDownward fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteNode(index)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  />
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        ステップの種類
                      </Typography>
                      <Select
                        size="small"
                        value={node.type}
                        onChange={(e) => updateNode(index, { type: e.target.value as NodeType })}
                      >
                        <MenuItem value="llm">LLM 応答</MenuItem>
                        <MenuItem value="tool">ツール実行</MenuItem>
                        <MenuItem value="http">HTTP リクエスト</MenuItem>
                        <MenuItem value="wait">待機</MenuItem>
                        <MenuItem value="python">Python コード (上級者向け)</MenuItem>
                        <MenuItem value="javascript">JavaScript コード (上級者向け)</MenuItem>
                      </Select>
                    </Stack>
                    {renderNodeConfig(node, index)}
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddNode}
              >
                ステップを追加
              </Button>
            </Stack>
          </Box>
        )}

        {mode === 'canvas' && (
          /* キャンバスモード：ノードとエッジを可視化（読み取り専用） */
          <Box sx={{ flex: 1, p: 3 }}>
            <Box sx={{ height: '100%', border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
              <ReactFlow
                nodes={canvasNodes}
                edges={canvasEdges}
                fitView
              >
                <MiniMap />
                <Controls />
                <Background />
              </ReactFlow>
            </Box>
          </Box>
        )}

        {/* 実行入力 & 結果 */}
        <Divider />
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                テスト入力 (JSON)
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={3}
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                placeholder='{"message": "こんにちは"}'
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                実行結果
              </Typography>
              {running && <CircularProgress size={24} />}
              {!running && runResult && (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Chip
                      label={runResult.success ? '成功' : '失敗'}
                      color={runResult.success ? 'success' : 'error'}
                      size="small"
                    />
                    {runResult.error && (
                      <Typography variant="body2" color="error">
                        {runResult.error}
                      </Typography>
                    )}
                  </Stack>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    value={JSON.stringify(runResult.node_results, null, 2)}
                    InputProps={{ readOnly: true }}
                  />
                </Box>
              )}
              {!running && !runResult && (
                <Typography variant="body2" color="text.secondary">
                  「テスト実行」を押すと、ここに結果が表示されます。
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default AIFlows;

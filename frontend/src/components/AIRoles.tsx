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
  TextField,
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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Code,
  Palette,
  Analytics,
  Business,
  Add,
  ExpandMore,
  PlayArrow,
  Star,
} from '@mui/icons-material';

interface Role {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  capabilities: string[];
  system_prompt: string;
  templates: Array<{
    id: string;
    name: string;
    prompt: string;
    variables: string[];
  }>;
}

interface TemplateVariables {
  [key: string]: string;
}

const AIRoles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateVariables, setTemplateVariables] = useState<TemplateVariables>({});
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customRoleDialogOpen, setCustomRoleDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customRole, setCustomRole] = useState({
    name: '',
    description: '',
    system_prompt: '',
    capabilities: [] as string[],
    templates: [] as Array<{ id: string; name: string; prompt: string; variables: string[] }>,
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles/');
      const data = await response.json();
      setRoles(data.roles);
    } catch (err) {
      setError('Failed to load roles');
    }
  };

  const getRoleIcon = (iconName: string) => {
    switch (iconName) {
      case 'code': return <Code />;
      case 'palette': return <Palette />;
      case 'analytics': return <Analytics />;
      case 'business': return <Business />;
      default: return <Star />;
    }
  };

  const selectRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/roles/${roleId}`);
      const data = await response.json();
      setSelectedRole(data.role);
      setSelectedTemplate('');
      setTemplateVariables({});
      setGeneratedPrompt('');
    } catch (err) {
      setError('Failed to load role details');
    }
  };

  const selectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (selectedRole) {
      const template = selectedRole.templates.find(t => t.id === templateId);
      if (template) {
        const variables: TemplateVariables = {};
        template.variables.forEach(varName => {
          variables[varName] = '';
        });
        setTemplateVariables(variables);
      }
    }
  };

  const updateVariable = (varName: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [varName]: value
    }));
  };

  const generatePrompt = async () => {
    if (!selectedRole || !selectedTemplate) {
      setError('Please select a role and template');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/roles/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_id: selectedRole.id,
          template_id: selectedTemplate,
          variables: templateVariables,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate prompt');
      }

      const data = await response.json();
      setGeneratedPrompt(data.prompt);
    } catch (err) {
      setError('Failed to generate prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const createCustomRole = async () => {
    try {
      const response = await fetch('/api/roles/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customRole),
      });

      if (!response.ok) {
        throw new Error('Failed to create custom role');
      }

      await loadRoles();
      setCustomRoleDialogOpen(false);
      setCustomRole({
        name: '',
        description: '',
        system_prompt: '',
        capabilities: [],
        templates: [],
      });
    } catch (err) {
      setError('Failed to create custom role');
    }
  };

  const addCapability = () => {
    const capability = prompt('Enter new capability:');
    if (capability) {
      setCustomRole(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, capability]
      }));
    }
  };

  const removeCapability = (index: number) => {
    setCustomRole(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter((_, i) => i !== index)
    }));
  };

  const currentTemplate = selectedRole?.templates.find(t => t.id === selectedTemplate);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AIロール
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ロール一覧 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">AIロール一覧</Typography>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setCustomRoleDialogOpen(true)}
                >
                  カスタム
                </Button>
              </Box>
              
              <List>
                {roles.map((role) => (
                  <ListItem
                    key={role.id}
                    button
                    selected={selectedRole?.id === role.id}
                    onClick={() => selectRole(role.id)}
                  >
                    <ListItemIcon sx={{ color: role.color }}>
                      {getRoleIcon(role.icon)}
                    </ListItemIcon>
                    <ListItemText
                      primary={role.name}
                      secondary={role.description}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* ロール詳細 */}
        <Grid item xs={12} md={8}>
          {selectedRole ? (
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                  <Box sx={{ color: selectedRole.color }}>
                    {getRoleIcon(selectedRole.icon)}
                  </Box>
                  <Typography variant="h6">{selectedRole.name}</Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedRole.description}
                </Typography>

                {/* 能力一覧 */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>能力</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {selectedRole.capabilities.map((capability, index) => (
                      <Chip key={index} label={capability} size="small" />
                    ))}
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* テンプレート選択 */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>テンプレート</Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>テンプレートを選択</InputLabel>
                    <Select
                      value={selectedTemplate}
                      onChange={(e) => selectTemplate(e.target.value)}
                    >
                      {selectedRole.templates.map((template) => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* 変数入力 */}
                {currentTemplate && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>パラメータ</Typography>
                    {currentTemplate.variables.map((varName) => (
                      <TextField
                        key={varName}
                        label={varName}
                        fullWidth
                        multiline
                        rows={2}
                        value={templateVariables[varName] || ''}
                        onChange={(e) => updateVariable(varName, e.target.value)}
                        sx={{ mb: 2 }}
                        placeholder={`${varName}を入力してください`}
                      />
                    ))}
                  </Box>
                )}

                {/* 生成ボタン */}
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={generatePrompt}
                  disabled={isGenerating || !selectedTemplate}
                  sx={{ mb: 2 }}
                >
                  {isGenerating ? '生成中...' : 'プロンプトを生成'}
                </Button>

                {/* 生成結果 */}
                {generatedPrompt && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle2">生成されたプロンプト</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                          {generatedPrompt}
                        </Typography>
                      </Paper>
                    </AccordionDetails>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" align="center">
                  AIロールを選択してください
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* カスタムロール作成ダイアログ */}
      <Dialog 
        open={customRoleDialogOpen} 
        onClose={() => setCustomRoleDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>カスタムAIロール作成</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="ロール名"
                fullWidth
                value={customRole.name}
                onChange={(e) => setCustomRole(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="説明"
                fullWidth
                value={customRole.description}
                onChange={(e) => setCustomRole(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="システムプロンプト"
                fullWidth
                multiline
                rows={4}
                value={customRole.system_prompt}
                onChange={(e) => setCustomRole(prev => ({ ...prev, system_prompt: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">能力</Typography>
                <Button size="small" onClick={addCapability}>
                  追加
                </Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {customRole.capabilities.map((capability, index) => (
                  <Chip
                    key={index}
                    label={capability}
                    onDelete={() => removeCapability(index)}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomRoleDialogOpen(false)}>キャンセル</Button>
          <Button onClick={createCustomRole} variant="contained">
            作成
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIRoles;

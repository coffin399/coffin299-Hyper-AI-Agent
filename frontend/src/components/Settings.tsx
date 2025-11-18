import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  Alert,
  Divider,
  Switch,
} from '@mui/material';
import { Settings as SettingsIcon, Save, Refresh } from '@mui/icons-material';
import type { Settings as SettingsType } from '../types/electron';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsType>({
    backendMode: 'local',
    backendPort: 18000,
    networkApiUrl: '',
    developerMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!window.electronAPI) {
      setMessage({ type: 'error', text: 'Electron API not available. Running in browser mode.' });
      setLoading(false);
      return;
    }

    try {
      const loadedSettings = await window.electronAPI.getSettings();
      setSettings(loadedSettings);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setMessage({ type: 'error', text: 'Failed to load settings' });
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!window.electronAPI) {
      setMessage({ type: 'error', text: 'Electron API not available' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await window.electronAPI.saveSettings(settings);
      setMessage({ type: 'success', text: 'Settings saved successfully. Please restart the app for changes to take effect.' });
    } catch (err) {
      console.error('Failed to save settings:', err);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SettingsIcon sx={{ mr: 1, fontSize: 32 }} />
        <Typography variant="h4">Settings</Typography>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Backend Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose how the application connects to the backend API
          </Typography>

          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend">Backend Mode</FormLabel>
            <RadioGroup
              value={settings.backendMode}
              onChange={(e) => setSettings({ ...settings, backendMode: e.target.value as 'local' | 'network' })}
            >
              <FormControlLabel
                value="local"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">Local (On-Premise)</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Run the backend on this computer. Best for privacy and offline use.
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="network"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">Network (Remote)</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Connect to a remote backend server. Requires network connection.
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          <Divider sx={{ my: 3 }} />

          {settings.backendMode === 'local' && (
            <TextField
              fullWidth
              label="Backend Port"
              type="number"
              value={settings.backendPort}
              onChange={(e) => setSettings({ ...settings, backendPort: parseInt(e.target.value) || 18000 })}
              helperText="Port number for the local backend server (default: 18000)"
              sx={{ mb: 3 }}
            />
          )}

          {settings.backendMode === 'network' && (
            <TextField
              fullWidth
              label="Network API URL"
              value={settings.networkApiUrl}
              onChange={(e) => setSettings({ ...settings, networkApiUrl: e.target.value })}
              placeholder="https://api.example.com"
              helperText="Full URL of the remote backend API (including protocol)"
              sx={{ mb: 3 }}
            />
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadSettings}
              disabled={saving}
            >
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            About Backend Modes
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Local Mode:</strong> The backend runs on your computer as a bundled executable. 
            All data stays on your machine, and no internet connection is required for core functionality.
          </Typography>
          <Typography variant="body2">
            <strong>Network Mode:</strong> The backend runs on a remote server. 
            This allows multiple users to share the same backend or use a more powerful server.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Developer Mode (Advanced)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enable this only in trusted, self-hosted environments. When combined with the
            backend setting <code>ENABLE_UNSAFE_EXEC=true</code>, workflows will be able to
            execute arbitrary Python and JavaScript code nodes. This can run any code with
            your user permissions.
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={settings.developerMode}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    developerMode: e.target.checked,
                  })
                }
                color="error"
              />
            }
            label={
              <Box>
                <Typography variant="body1">Enable Developer Mode</Typography>
                <Typography variant="body2" color="text.secondary">
                  When enabled (and the backend allows unsafe execution), AI workflows can
                  include Python/JavaScript execution nodes. Use at your own risk.
                </Typography>
              </Box>
            }
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;

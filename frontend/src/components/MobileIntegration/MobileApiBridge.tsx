import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Alert,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Api as ApiIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Speed as SpeedIcon,
  DataUsage as DataIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  CloudQueue as QueueIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as CopyIcon,
  Code as CodeIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  MobileApiResponse,
  MobileNetworkStatus,
  PendingSyncItem,
} from '../../types/mobile';

interface MobileApiBridgeProps {
  apiUrl: string;
  authToken?: string;
  networkStatus: MobileNetworkStatus;
  pendingRequests: ApiRequest[];
  onRequest: (request: ApiRequest) => Promise<MobileApiResponse<any>>;
  onRetry: (requestId: string) => Promise<void>;
  onCancelRequest: (requestId: string) => void;
  onClearQueue: () => void;
  maxRetries?: number;
  requestTimeout?: number;
}

interface ApiRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  headers?: Record<string, string>;
  body?: any;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  response?: any;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  size?: number;
  duration?: number;
}

interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalDataTransferred: number;
  requestsPerMinute: number;
  successRate: number;
}

const MobileApiBridge: React.FC<MobileApiBridgeProps> = ({
  apiUrl,
  authToken,
  networkStatus,
  pendingRequests,
  onRequest,
  onRetry,
  onCancelRequest,
  onClearQueue,
  maxRetries = 3,
  requestTimeout = 30000,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [metrics, setMetrics] = useState<ApiMetrics>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    totalDataTransferred: 0,
    requestsPerMinute: 0,
    successRate: 0,
  });
  const [expandedRequests, setExpandedRequests] = useState<string[]>([]);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testRequest, setTestRequest] = useState<Partial<ApiRequest>>({
    method: 'GET',
    endpoint: '/api/health',
    priority: 'medium',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const requestHistory = useRef<ApiRequest[]>([]);

  // Calculate metrics
  useEffect(() => {
    const history = [...requestHistory.current, ...pendingRequests];
    const completed = history.filter(r => r.status === 'completed' || r.status === 'failed');
    const successful = completed.filter(r => r.status === 'completed');
    const failed = completed.filter(r => r.status === 'failed');

    const totalTime = completed.reduce((sum, r) => sum + (r.duration || 0), 0);
    const totalSize = completed.reduce((sum, r) => sum + (r.size || 0), 0);

    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = completed.filter(r => 
      r.completedAt && new Date(r.completedAt).getTime() > oneMinuteAgo
    );

    setMetrics({
      totalRequests: history.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      averageResponseTime: completed.length > 0 ? totalTime / completed.length : 0,
      totalDataTransferred: totalSize,
      requestsPerMinute: recentRequests.length,
      successRate: completed.length > 0 ? (successful.length / completed.length) * 100 : 0,
    });
  }, [pendingRequests]);

  const getStatusColor = (status: ApiRequest['status']) => {
    switch (status) {
      case 'completed':
        return theme.palette.success.main;
      case 'failed':
        return theme.palette.error.main;
      case 'processing':
        return theme.palette.info.main;
      case 'cancelled':
        return theme.palette.grey[500];
      default:
        return theme.palette.warning.main;
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const toggleRequestExpanded = (requestId: string) => {
    setExpandedRequests(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleTestRequest = async () => {
    if (testRequest.method && testRequest.endpoint) {
      const request: ApiRequest = {
        id: Date.now().toString(),
        method: testRequest.method as any,
        endpoint: testRequest.endpoint,
        body: testRequest.body,
        priority: testRequest.priority as any || 'medium',
        retryCount: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await onRequest(request);
      setShowTestDialog(false);
      setTestRequest({
        method: 'GET',
        endpoint: '/api/health',
        priority: 'medium',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderRequestList = () => {
    if (pendingRequests.length === 0) {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('api.noRequests')}
          </Typography>
        </Box>
      );
    }

    return (
      <List>
        {pendingRequests.map(request => (
          <Box key={request.id}>
            <ListItem
              button
              onClick={() => toggleRequestExpanded(request.id)}
            >
              <ListItemIcon>
                <Chip
                  label={request.method}
                  size="small"
                  color={
                    request.method === 'GET' ? 'primary' :
                    request.method === 'POST' ? 'success' :
                    request.method === 'DELETE' ? 'error' : 'warning'
                  }
                  variant="outlined"
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {request.endpoint}
                    </Typography>
                    <Chip
                      icon={
                        request.status === 'completed' ? <SuccessIcon /> :
                        request.status === 'failed' ? <ErrorIcon /> :
                        request.status === 'processing' ? <RefreshIcon className="rotating" /> :
                        <ScheduleIcon />
                      }
                      label={t(`api.status.${request.status}`)}
                      size="small"
                      sx={{
                        backgroundColor: alpha(getStatusColor(request.status), 0.1),
                        color: getStatusColor(request.status),
                      }}
                    />
                  </Stack>
                }
                secondary={
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={2}>
                      <Typography variant="caption">
                        {t('api.priority')}: {t(`api.priority.${request.priority}`)}
                      </Typography>
                      {request.retryCount > 0 && (
                        <Typography variant="caption">
                          {t('api.retries')}: {request.retryCount}/{maxRetries}
                        </Typography>
                      )}
                      {request.duration && (
                        <Typography variant="caption">
                          {t('api.duration')}: {formatDuration(request.duration)}
                        </Typography>
                      )}
                      {request.size && (
                        <Typography variant="caption">
                          {t('api.size')}: {formatBytes(request.size)}
                        </Typography>
                      )}
                    </Stack>
                    {request.error && (
                      <Alert severity="error" sx={{ py: 0.5, px: 1 }}>
                        <Typography variant="caption">{request.error}</Typography>
                      </Alert>
                    )}
                  </Stack>
                }
              />
              <ListItemSecondaryAction>
                <Stack direction="row" spacing={1}>
                  {request.status === 'failed' && request.retryCount < maxRetries && (
                    <Tooltip title={t('api.retry')}>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetry(request.id);
                        }}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {(request.status === 'pending' || request.status === 'processing') && (
                    <Tooltip title={t('api.cancel')}>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelRequest(request.id);
                        }}
                      >
                        <StopIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton edge="end" size="small">
                    {expandedRequests.includes(request.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Stack>
              </ListItemSecondaryAction>
            </ListItem>

            <Collapse in={expandedRequests.includes(request.id)}>
              <Box sx={{ pl: 8, pr: 2, pb: 2 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    {/* Headers */}
                    {request.headers && (
                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2">{t('api.headers')}</Typography>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(JSON.stringify(request.headers, null, 2))}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem', mt: 1 }}>
                          <pre style={{ margin: 0, overflow: 'auto' }}>
                            {JSON.stringify(request.headers, null, 2)}
                          </pre>
                        </Box>
                      </Box>
                    )}

                    {/* Body */}
                    {request.body && (
                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2">{t('api.body')}</Typography>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(JSON.stringify(request.body, null, 2))}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem', mt: 1 }}>
                          <pre style={{ margin: 0, overflow: 'auto', maxHeight: 200 }}>
                            {JSON.stringify(request.body, null, 2)}
                          </pre>
                        </Box>
                      </Box>
                    )}

                    {/* Response */}
                    {request.response && (
                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2">{t('api.response')}</Typography>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(JSON.stringify(request.response, null, 2))}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem', mt: 1 }}>
                          <pre style={{ margin: 0, overflow: 'auto', maxHeight: 200 }}>
                            {JSON.stringify(request.response, null, 2)}
                          </pre>
                        </Box>
                      </Box>
                    )}

                    {/* Timestamps */}
                    <Divider />
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">
                          {t('api.created')}:
                        </Typography>
                        <Typography variant="caption">
                          {format(new Date(request.createdAt), 'PP p')}
                        </Typography>
                      </Grid>
                      {request.startedAt && (
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            {t('api.started')}:
                          </Typography>
                          <Typography variant="caption">
                            {format(new Date(request.startedAt), 'PP p')}
                          </Typography>
                        </Grid>
                      )}
                      {request.completedAt && (
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            {t('api.completed')}:
                          </Typography>
                          <Typography variant="caption">
                            {format(new Date(request.completedAt), 'PP p')}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Stack>
                </Paper>
              </Box>
            </Collapse>
          </Box>
        ))}
      </List>
    );
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <ApiIcon color="primary" />
              <Typography variant="h6">{t('api.title')}</Typography>
              <Chip
                icon={networkStatus.isConnected ? <SuccessIcon /> : <ErrorIcon />}
                label={
                  networkStatus.isConnected
                    ? `${t('api.online')} (${networkStatus.connectionType})`
                    : t('api.offline')
                }
                color={networkStatus.isConnected ? 'success' : 'error'}
                size="small"
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<CodeIcon />}
                onClick={() => setShowTestDialog(true)}
                size="small"
              >
                {t('api.test')}
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={onClearQueue}
                disabled={pendingRequests.length === 0}
                size="small"
              >
                {t('api.clearQueue')}
              </Button>
            </Stack>
          </Stack>

          {/* Connection Info */}
          <Alert severity={networkStatus.isConnected ? 'success' : 'warning'}>
            <Stack spacing={1}>
              <Typography variant="body2">
                {t('api.endpoint')}: <strong>{apiUrl}</strong>
              </Typography>
              {authToken && (
                <Typography variant="body2">
                  {t('api.authenticated')}: <strong>{t('common.yes')}</strong>
                </Typography>
              )}
              {networkStatus.isConnected && networkStatus.effectiveType && (
                <Typography variant="body2">
                  {t('api.connectionSpeed')}: <strong>{networkStatus.effectiveType.toUpperCase()}</strong>
                  {networkStatus.downlinkSpeed && ` (${networkStatus.downlinkSpeed} Mbps)`}
                </Typography>
              )}
            </Stack>
          </Alert>

          {/* Metrics */}
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1} alignItems="center">
                    <DataIcon color="action" />
                    <Typography variant="h6">{metrics.totalRequests}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('api.totalRequests')}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1} alignItems="center">
                    <SpeedIcon color="action" />
                    <Typography variant="h6">
                      {metrics.averageResponseTime.toFixed(0)}ms
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('api.avgResponseTime')}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1} alignItems="center">
                    <SecurityIcon color="action" />
                    <Typography variant="h6">{metrics.successRate.toFixed(1)}%</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('api.successRate')}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1} alignItems="center">
                    <QueueIcon color="action" />
                    <Typography variant="h6">{pendingRequests.length}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('api.pendingRequests')}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Request Queue */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              {t('api.requestQueue')}
            </Typography>
            {isProcessing && (
              <LinearProgress variant="indeterminate" sx={{ mb: 2 }} />
            )}
            {renderRequestList()}
          </Box>
        </Stack>
      </Paper>

      {/* Test Request Dialog */}
      <Dialog
        open={showTestDialog}
        onClose={() => setShowTestDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('api.testRequest')}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>{t('api.method')}</InputLabel>
              <Select
                value={testRequest.method}
                onChange={(e) => setTestRequest({ ...testRequest, method: e.target.value as any })}
                label={t('api.method')}
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
                <MenuItem value="PATCH">PATCH</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={t('api.endpoint')}
              value={testRequest.endpoint}
              onChange={(e) => setTestRequest({ ...testRequest, endpoint: e.target.value })}
              placeholder="/api/resource"
              required
            />

            <TextField
              fullWidth
              label={t('api.body')}
              value={typeof testRequest.body === 'string' ? testRequest.body : JSON.stringify(testRequest.body || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setTestRequest({ ...testRequest, body: parsed });
                } catch {
                  setTestRequest({ ...testRequest, body: e.target.value });
                }
              }}
              multiline
              rows={6}
              placeholder="{}"
              disabled={testRequest.method === 'GET' || testRequest.method === 'DELETE'}
            />

            <FormControl fullWidth>
              <InputLabel>{t('api.priority')}</InputLabel>
              <Select
                value={testRequest.priority}
                onChange={(e) => setTestRequest({ ...testRequest, priority: e.target.value as any })}
                label={t('api.priority')}
              >
                <MenuItem value="low">{t('api.priority.low')}</MenuItem>
                <MenuItem value="medium">{t('api.priority.medium')}</MenuItem>
                <MenuItem value="high">{t('api.priority.high')}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTestDialog(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleTestRequest}
            disabled={!testRequest.method || !testRequest.endpoint}
          >
            {t('api.send')}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default MobileApiBridge;
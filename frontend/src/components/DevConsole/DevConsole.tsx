import React, { useState, useEffect, useRef } from 'react';
import { Space, Tag, Button, Collapse, Typography, Alert, Badge, Tooltip } from 'antd';
import { 
  UpOutlined,
  DownOutlined,
  CopyOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  CheckOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'error' | 'warn' | 'info' | 'network';
  message: string;
  details?: any;
}

interface BackendStatus {
  isHealthy: boolean;
  lastChecked: Date;
  details?: any;
  error?: string;
}

export const DevConsole: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    isHealthy: false,
    lastChecked: new Date(),
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const originalConsole = useRef<{
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
  } | null>(null);

  // Check backend health
  const checkBackendHealth = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      setBackendStatus({
        isHealthy: response.ok && data.status === 'ok',
        lastChecked: new Date(),
        details: data,
      });

      addLog('info', `Backend health check: ${response.ok ? 'OK' : 'Failed'}`, data);
    } catch (error) {
      setBackendStatus({
        isHealthy: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      addLog('error', 'Backend health check failed', error);
    }
  };

  // Add log entry
  const addLog = (type: LogEntry['type'], message: string, details?: any) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type,
      message,
      details,
    };

    // Defer state update to avoid updating during render
    setTimeout(() => {
      setLogs(prev => [entry, ...prev].slice(0, 100)); // Keep last 100 logs
    }, 0);
  };

  // Override console methods
  useEffect(() => {
    if (!originalConsole.current) {
      originalConsole.current = {
        error: console.error,
        warn: console.warn,
        info: console.info,
      };
    }

    console.error = (...args) => {
      originalConsole.current?.error(...args);
      // Use setTimeout to defer state updates
      setTimeout(() => addLog('error', args.join(' '), args), 0);
    };

    console.warn = (...args) => {
      originalConsole.current?.warn(...args);
      // Use setTimeout to defer state updates
      setTimeout(() => addLog('warn', args.join(' '), args), 0);
    };

    console.info = (...args) => {
      originalConsole.current?.info(...args);
      // Use setTimeout to defer state updates
      setTimeout(() => addLog('info', args.join(' '), args), 0);
    };

    // Intercept fetch for network logs
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const startTime = Date.now();
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        // Defer network log to avoid state updates during render
        setTimeout(() => {
          addLog('network', `${options?.method || 'GET'} ${url} - ${response.status} (${duration}ms)`, {
            url,
            status: response.status,
            duration,
            method: options?.method || 'GET',
          });
        }, 0);
        
        return response;
      } catch (error) {
        // Defer error log to avoid state updates during render
        setTimeout(() => addLog('error', `Network error: ${url}`, error), 0);
        throw error;
      }
    };

    // Check backend health on mount and every 30 seconds
    checkBackendHealth();
    const healthInterval = setInterval(checkBackendHealth, 30000);

    return () => {
      clearInterval(healthInterval);
      // Restore original console methods
      if (originalConsole.current) {
        console.error = originalConsole.current.error;
        console.warn = originalConsole.current.warn;
        console.info = originalConsole.current.info;
      }
      window.fetch = originalFetch;
    };
  }, []);

  // Copy logs to clipboard
  const copyLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp.toISOString()}] ${log.type.toUpperCase()}: ${log.message}${
        log.details ? '\nDetails: ' + JSON.stringify(log.details, null, 2) : ''
      }`
    ).join('\n\n');

    const fullReport = `
=== PLP Mentor Development Console Report ===
Generated: ${new Date().toISOString()}

Backend Status: ${backendStatus.isHealthy ? 'HEALTHY' : 'UNHEALTHY'}
Last Checked: ${backendStatus.lastChecked.toISOString()}
${backendStatus.error ? `Error: ${backendStatus.error}` : ''}
${backendStatus.details ? `Details: ${JSON.stringify(backendStatus.details, null, 2)}` : ''}

=== Console Logs ===
${logText}
    `.trim();

    navigator.clipboard.writeText(fullReport);
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy single log
  const copyLog = (log: LogEntry) => {
    const text = `[${log.timestamp.toISOString()}] ${log.type.toUpperCase()}: ${log.message}${
      log.details ? '\nDetails: ' + JSON.stringify(log.details, null, 2) : ''
    }`;
    
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Get log color
  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return 'error';
      case 'warn':
        return 'warning';
      case 'network':
        return 'processing';
      default:
        return 'default';
    }
  };

  // Get log icon
  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return <CloseCircleOutlined />;
      case 'warn':
        return <WarningOutlined />;
      case 'info':
        return <InfoCircleOutlined />;
      default:
        return null;
    }
  };

  // Don't show in production
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#fff',
        borderTop: `3px solid ${backendStatus.isHealthy ? '#52c41a' : '#ff4d4f'}`,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
      }}
    >
      {/* Console Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Space align="center">
          <Text strong>Dev Console</Text>
          
          <Tag
            icon={backendStatus.isHealthy ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            color={backendStatus.isHealthy ? 'success' : 'error'}
            style={{ cursor: 'pointer' }}
            onClick={checkBackendHealth}
          >
            Backend: {backendStatus.isHealthy ? 'Healthy' : 'Unhealthy'}
          </Tag>
          
          <Badge count={logs.length} style={{ backgroundColor: '#1890ff' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>logs</Text>
          </Badge>
        </Space>

        <Space>
          <Tooltip title="Refresh backend status">
            <Button 
              icon={<ReloadOutlined />} 
              size="small" 
              onClick={checkBackendHealth}
            />
          </Tooltip>
          <Button
            size="small"
            type="primary"
            ghost
            icon={copiedId === 'all' ? <CheckOutlined /> : <CopyOutlined />}
            onClick={copyLogs}
            disabled={logs.length === 0}
          >
            {copiedId === 'all' ? 'Copied!' : 'Copy All'}
          </Button>
          <Tooltip title="Clear logs">
            <Button 
              icon={<ClearOutlined />} 
              size="small" 
              onClick={clearLogs} 
              disabled={logs.length === 0}
            />
          </Tooltip>
          <Button 
            icon={isExpanded ? <DownOutlined /> : <UpOutlined />} 
            size="small" 
            onClick={() => setIsExpanded(!isExpanded)}
          />
        </Space>
      </div>

      {/* Console Content */}
      {isExpanded && (
        <div
          style={{
            maxHeight: 300,
            overflowY: 'auto',
            backgroundColor: '#fafafa',
          }}
        >
          {logs.length === 0 ? (
            <Alert
              message="No logs yet"
              description="Console errors, warnings, and network requests will appear here."
              type="info"
              showIcon
              style={{ margin: 16 }}
            />
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                style={{
                  padding: '8px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: '#fff',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                <Space align="start" style={{ width: '100%' }}>
                  {getLogIcon(log.type)}
                  <div style={{ flex: 1 }}>
                    <Space>
                      <Tag color={getLogColor(log.type)}>{log.type.toUpperCase()}</Tag>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {log.timestamp.toLocaleTimeString()}
                      </Text>
                    </Space>
                    <div style={{ marginTop: 4 }}>
                      <Text>{log.message}</Text>
                    </div>
                    {log.details && (
                      <pre
                        style={{
                          marginTop: 8,
                          padding: 8,
                          backgroundColor: '#f5f5f5',
                          borderRadius: 4,
                          overflow: 'auto',
                          maxHeight: 100,
                          fontSize: '12px',
                        }}
                      >
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                  <Tooltip title="Copy this log">
                    <Button
                      icon={copiedId === log.id ? <CheckOutlined /> : <CopyOutlined />}
                      size="small"
                      type="text"
                      onClick={() => copyLog(log)}
                      style={{ opacity: 0.6 }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                    />
                  </Tooltip>
                </Space>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
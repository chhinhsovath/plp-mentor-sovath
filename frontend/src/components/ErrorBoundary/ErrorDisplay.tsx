import React from 'react';
import { Alert, Button, Typography, Space, Collapse } from 'antd';
import { ReloadOutlined, InfoCircleOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ErrorInfo, ErrorService } from '../../services/error.service';

interface ErrorDisplayProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  compact = false,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState(false);

  const getType = (error: ErrorInfo): 'error' | 'warning' | 'info' | 'success' => {
    if (error.statusCode && error.statusCode >= 500) {
      return 'error';
    }
    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT_ERROR') {
      return 'warning';
    }
    return 'error';
  };

  const getIcon = (error: ErrorInfo) => {
    if (error.code === 'NETWORK_ERROR') {
      return <InfoCircleOutlined />;
    }
    return undefined;
  };

  const shouldShowRetry = onRetry && ErrorService.shouldShowRetryButton(error);

  if (compact) {
    return (
      <Alert 
        type={getType(error)}
        icon={getIcon(error)}
        closable={!!onDismiss}
        onClose={onDismiss}
        message={error.message}
        action={
          shouldShowRetry ? (
            <Button
              type="link"
              size="small"
              onClick={onRetry}
              icon={<ReloadOutlined />}
            >
              {t('errors.async.retry')}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const { Panel } = Collapse;
  const { Text, Paragraph } = Typography;

  return (
    <Alert 
      type={getType(error)}
      icon={getIcon(error)}
      closable={!!onDismiss}
      onClose={onDismiss}
      message={
        error.code === 'NETWORK_ERROR' 
          ? t('errors.network.offline')
          : t('common.error')
      }
      description={
        <div>
          <Paragraph>{error.message}</Paragraph>

          <Space wrap>
            {shouldShowRetry && (
              <Button
                type="default"
                size="small"
                onClick={onRetry}
                icon={<ReloadOutlined />}
              >
                {t('errors.async.retry')}
              </Button>
            )}

            {(showDetails || error.details) && (
              <Button
                type="link"
                size="small"
                onClick={() => setExpanded(!expanded)}
                icon={expanded ? <UpOutlined /> : <DownOutlined />}
              >
                {expanded ? t('common.hide') : t('common.showDetails')}
              </Button>
            )}
          </Space>

          <Collapse 
            activeKey={expanded ? ['1'] : []}
            ghost
            style={{ marginTop: 16 }}
          >
            <Panel 
              key="1" 
              showArrow={false}
              style={{ 
                backgroundColor: '#f5f5f5', 
                borderRadius: 4,
                padding: 16
              }}
            >
              <div>
                <Text strong>Error Code:</Text> <Text code>{error.code}</Text>
              </div>
              
              {error.statusCode && (
                <div style={{ marginTop: 8 }}>
                  <Text strong>Status Code:</Text> <Text code>{error.statusCode}</Text>
                </div>
              )}

              {error.details && (
                <div style={{ marginTop: 8 }}>
                  <Text strong>Details:</Text>
                  <pre style={{ fontSize: '0.75rem', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(error.details, null, 2)}
                  </pre>
                </div>
              )}
            </Panel>
          </Collapse>
        </div>
      }
    />
  );
};

export default ErrorDisplay;
import React, { Component, ReactNode } from 'react';
import { Typography, Button, Card, Alert, Spin, Space } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
  loading?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

// Specialized error boundary for async operations with retry logic
class AsyncErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error) {
    console.error('AsyncErrorBoundary caught an error:', error);
    
    // Auto-retry for network errors
    if (this.isRetriableError(error) && this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private isRetriableError = (error: Error): boolean => {
    // Check if error is retriable (network errors, timeouts, etc.)
    const retriablePatterns = [
      /network/i,
      /timeout/i,
      /fetch/i,
      /connection/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
    ];

    return retriablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  };

  private scheduleRetry = () => {
    const delay = Math.pow(2, this.state.retryCount) * 1000; // Exponential backoff
    
    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1,
      }));
    }, delay);
  };

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0,
    });

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.props.loading) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            gap: 16,
          }}
        >
          <Spin size="large" />
          <Typography.Text type="secondary">
            Loading...
          </Typography.Text>
        </div>
      );
    }

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <AsyncErrorFallback
          error={this.state.error}
          retryCount={this.state.retryCount}
          maxRetries={this.maxRetries}
          onRetry={this.handleManualRetry}
          isRetriable={this.state.error ? this.isRetriableError(this.state.error) : false}
        />
      );
    }

    return this.props.children;
  }
}

const AsyncErrorFallback: React.FC<{
  error: Error | null;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  isRetriable: boolean;
}> = ({ error, retryCount, maxRetries, onRetry, isRetriable }) => {
  const { t } = useTranslation();

  const { Title, Text, Paragraph } = Typography;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        padding: 24,
      }}
    >
      <Card
        style={{
          padding: 24,
          maxWidth: 500,
          textAlign: 'center',
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <ExclamationCircleOutlined 
            style={{ 
              fontSize: 60, 
              color: '#ff4d4f',
            }} 
          />
          
          <Title level={4}>
            {t('errors.async.title')}
          </Title>
          
          <Paragraph type="secondary">
            {isRetriable 
              ? t('errors.async.networkMessage')
              : t('errors.async.generalMessage')
            }
          </Paragraph>

          {error && (
            <Alert 
              type="error" 
              message={
                <Text style={{ fontSize: '12px' }}>
                  {error.message}
                </Text>
              }
              style={{ textAlign: 'left' }}
            />
          )}

          {retryCount > 0 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('errors.async.retryAttempt', { count: retryCount, max: maxRetries })}
            </Text>
          )}

          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={onRetry}
            disabled={retryCount >= maxRetries && isRetriable}
            size="small"
          >
            {t('errors.async.retry')}
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default AsyncErrorBoundary;
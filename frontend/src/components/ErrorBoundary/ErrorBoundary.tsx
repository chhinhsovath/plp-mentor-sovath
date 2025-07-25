import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, Typography, Button, Alert, Space } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Error Boundary component that catches JavaScript errors anywhere in the child component tree
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service (implement based on your monitoring solution)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Integrate with error monitoring service (e.g., Sentry, LogRocket)
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // For now, log to console. Replace with actual service call
    console.error('Error logged to monitoring service:', errorData);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return <ErrorFallback 
        error={this.state.error} 
        onRetry={this.handleRetry}
        onGoHome={this.handleGoHome}
      />;
    }

    return this.props.children;
  }
}

// Functional component for error display with Khmer support
const ErrorFallback = ({
  error,
  onRetry,
  onGoHome,
}: {
  error: Error | null;
  onRetry: () => void;
  onGoHome: () => void;
}) => {
  const { t } = useTranslation();
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        padding: 24,
      }}
    >
      <Card
        style={{
          padding: 32,
          maxWidth: 600,
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <ExclamationCircleOutlined 
            style={{ 
              fontSize: 80, 
              color: '#ff4d4f',
            }} 
          />
        </div>
        
        <Typography.Title level={2}>
          {t('error.title')}
        </Typography.Title>
        
        <Typography.Paragraph type="secondary">
          {t('error.description')}
        </Typography.Paragraph>

        {error && (
          <Alert 
            message={t('error.details')} 
            description={error.message} 
            type="error" 
            showIcon 
            style={{ marginBottom: 24, textAlign: 'left' }}
          />
        )}

        <Space wrap>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={onRetry}
          >
            {t('error.tryAgain')}
          </Button>
          
          <Button
            type="default"
            icon={<HomeOutlined />}
            onClick={onGoHome}
          >
            {t('error.goHome')}
          </Button>
        </Space>

        <Typography.Text type="secondary" style={{ marginTop: 16, display: 'block' }}>
          {t('error.contactSupport')}
        </Typography.Text>
      </Card>
    </div>
  );
};

export default ErrorBoundary;
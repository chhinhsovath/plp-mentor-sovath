import React, { useState } from 'react';
import { Button, Space } from 'antd';
import { BugOutlined } from '@ant-design/icons';

// Component that intentionally throws an error for testing
const ErrorThrowingComponent = () => {
  throw new Error('Test error: This is an intentional error for testing the ErrorBoundary');
};

// Test component to verify ErrorBoundary functionality
export const TestErrorBoundary = () => {
  const [showError, setShowError] = useState(false);

  if (showError) {
    return <ErrorThrowingComponent />;
  }

  return (
    <Space direction="vertical" size="large" style={{ padding: 24 }}>
      <h2>ErrorBoundary Test Component</h2>
      <p>Click the button below to trigger an error and see the ErrorBoundary in action.</p>
      <Button 
        type="primary" 
        danger 
        icon={<BugOutlined />}
        onClick={() => setShowError(true)}
      >
        Trigger Error
      </Button>
    </Space>
  );
};
import React, { useState } from 'react';
import { Card, Button, Typography, Space, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface DataRefreshManagerProps {
  onRefresh?: () => void;
  loading?: boolean;
  lastUpdated?: Date;
}

const DataRefreshManager: React.FC<DataRefreshManagerProps> = ({ 
  onRefresh, 
  loading = false, 
  lastUpdated 
}) => {
  const { t } = useTranslation();

  return (
    <Card size="small">
      <Space>
        <Button 
          icon={<ReloadOutlined />} 
          loading={loading}
          onClick={onRefresh}
          size="small"
        >
          {t('common.refresh') || 'Refresh'}
        </Button>
        <Text type="secondary">
          {lastUpdated 
            ? `Last updated: ${lastUpdated.toLocaleTimeString()}` 
            : 'Not updated yet'
          }
        </Text>
        <Tag color="green">Auto-refresh enabled</Tag>
      </Space>
    </Card>
  );
};

export default DataRefreshManager;
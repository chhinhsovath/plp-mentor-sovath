import React from 'react';
import { Card, Typography, Button, Result, Space } from 'antd';
import { FormOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

const SampleFormCreation: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>
              {t('forms.sampleCreation') || 'Sample Form Creation'}
            </Title>
          </div>

          <Result
            icon={<FormOutlined />}
            title="Sample Form Creation"
            subTitle="This page is being migrated to Ant Design. Full functionality coming soon."
            extra={
              <Space>
                <Button type="primary" icon={<PlusCircleOutlined />}>
                  {t('forms.createSample') || 'Create Sample'}
                </Button>
                <Button>
                  View Templates
                </Button>
              </Space>
            }
          />
        </Space>
      </Card>
    </div>
  );
};

export default SampleFormCreation;
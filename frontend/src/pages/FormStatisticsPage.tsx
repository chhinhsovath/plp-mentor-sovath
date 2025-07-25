import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Result, Space } from 'antd';
import { BarChartOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

const FormStatisticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/forms')}
              type="text"
            >
              {t('common.back')}
            </Button>
            <Title level={2}>
              {t('forms.statistics') || 'Form Statistics'}
            </Title>
          </div>

          <Result
            icon={<BarChartOutlined />}
            title="Form Statistics"
            subTitle="This page is being migrated to Ant Design. Full functionality coming soon."
            extra={
              <Space>
                <Button type="primary">
                  {t('statistics.viewCharts') || 'View Charts'}
                </Button>
                <Button>
                  Export Statistics
                </Button>
              </Space>
            }
          />
        </Space>
      </Card>
    </div>
  );
};

export default FormStatisticsPage;
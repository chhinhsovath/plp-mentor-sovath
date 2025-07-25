import { useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Tag,
  Button,
  Table,
  Alert,
  Skeleton,
  Space,
  Empty,
  Segmented,
} from 'antd';
import {
  SwapOutlined,
  RiseOutlined,
  DownloadOutlined,
  BarChartOutlined,
  RadarChartOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ChartWidget from './ChartWidget';

const { Title, Text } = Typography;

interface ComparisonViewProps {
  data?: any[];
  loading?: boolean;
  error?: string;
  showExport?: boolean;
  defaultView?: 'chart' | 'table' | 'radar';
}

const ComparisonView = ({
  data = [],
  loading = false,
  error,
  showExport = true,
  defaultView = 'chart',
}: ComparisonViewProps) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState(defaultView);

  if (loading) {
    return (
      <Card>
        <Skeleton active />
        <Row gutter={16} style={{ marginTop: 16 }}>
          {[1, 2, 3].map(i => (
            <Col xs={24} md={8} key={i}>
              <Skeleton.Image style={{ width: '100%', height: 200 }} />
            </Col>
          ))}
        </Row>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert message="Error" description={error} type="error" />
      </Card>
    );
  }

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <SwapOutlined style={{ color: '#1890ff', fontSize: 20 }} />
              <Title level={4} style={{ margin: 0 }}>
                {t('comparison.title') || 'Comparison View'}
              </Title>
            </Space>
          </Col>
          
          <Col>
            <Space>
              <Segmented
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { value: 'chart', icon: <BarChartOutlined /> },
                  { value: 'radar', icon: <RadarChartOutlined /> },
                  { value: 'table', icon: <TableOutlined /> },
                ]}
              />
              
              {showExport && (
                <Button icon={<DownloadOutlined />} size="small">
                  {t('common.export') || 'Export'}
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* Content */}
        {data.length > 0 ? (
          <div>
            {viewMode === 'chart' && (
              <ChartWidget title="Comparison Chart" height={400} type="bar" data={data} loading={loading}>
                <Empty description="Chart visualization coming soon" />
              </ChartWidget>
            )}
            
            {viewMode === 'radar' && (
              <ChartWidget title="Radar Chart" height={400} type="area" data={data} loading={loading}>
                <Empty description="Radar chart visualization coming soon" />
              </ChartWidget>
            )}
            
            {viewMode === 'table' && (
              <Table
                columns={[
                  {
                    title: t('comparison.item') || 'Item',
                    dataIndex: 'name',
                    key: 'name',
                  },
                  {
                    title: t('comparison.score') || 'Score',
                    dataIndex: 'score',
                    key: 'score',
                    render: (value) => value?.toFixed(2) || 'N/A',
                  },
                  {
                    title: t('comparison.trend') || 'Trend',
                    key: 'trend',
                    render: () => (
                      <Tag color="green">
                        <RiseOutlined /> Up
                      </Tag>
                    ),
                  },
                ]}
                dataSource={[
                  { key: '1', name: 'Sample Item 1', score: 85.5 },
                  { key: '2', name: 'Sample Item 2', score: 92.3 },
                ]}
                size="small"
              />
            )}
          </div>
        ) : (
          <Empty description={t('comparison.noData') || 'No comparison data available'} />
        )}

        {/* Info Card */}
        <Card size="small" style={{ backgroundColor: '#f6f8fa' }}>
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            <Text type="secondary">
              {t('comparison.info') || 'Select items to compare and view detailed analytics.'}
            </Text>
          </Space>
        </Card>
      </Space>
    </Card>
  );
};

export default ComparisonView;
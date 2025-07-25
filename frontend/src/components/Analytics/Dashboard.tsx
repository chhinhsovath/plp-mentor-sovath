import React from 'react';
import { Card, Typography, Row, Col, Statistic, Empty } from 'antd';
import { DashboardOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

interface DashboardProps {
  data?: any[];
  loading?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ data = [], loading = false }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={3}>
            <DashboardOutlined /> {t('analytics.dashboard') || 'Analytics Dashboard'}
          </Title>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic title="Total Users" value={125} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic title="Observations" value={89} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic title="Forms" value={34} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic title="Reports" value={12} />
        </Col>
        <Col span={24}>
          <Empty description="Dashboard widgets coming soon" />
        </Col>
      </Row>
    </Card>
  );
};

export default Dashboard;
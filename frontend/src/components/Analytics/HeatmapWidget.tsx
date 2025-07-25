import React from 'react';
import { Card, Typography, Empty } from 'antd';
import { DotChartOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

interface HeatmapWidgetProps {
  data?: any[];
  loading?: boolean;
  title?: string;
}

const HeatmapWidget: React.FC<HeatmapWidgetProps> = ({ 
  data = [], 
  loading = false, 
  title = 'Heatmap' 
}) => {
  const { t } = useTranslation();

  return (
    <Card loading={loading}>
      <Title level={4}>
        <DotChartOutlined /> {title}
      </Title>
      <Empty description="Heatmap visualization coming soon" />
    </Card>
  );
};

export default HeatmapWidget;
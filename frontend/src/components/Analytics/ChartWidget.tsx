import React from 'react'
import { Card, Typography, Empty } from 'antd'
import { AreaChartOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface ChartWidgetProps {
  title?: string
  type?: 'line' | 'bar' | 'pie' | 'area'
  data?: any[]
  loading?: boolean
  height?: number
}

const ChartWidget: React.FC<ChartWidgetProps> = ({
  title = 'Chart Widget',
  type = 'line',
  data = [],
  loading = false,
  height = 300,
}) => {
  return (
    <Card title={title} loading={loading}>
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty
          image={<AreaChartOutlined style={{ fontSize: '48px', color: '#1890ff' }} />}
          description={
            <div>
              <Text type="secondary">Chart visualization coming soon</Text>
              <br />
              <Text type="secondary">Type: {type} | Data points: {data.length}</Text>
            </div>
          }
        />
      </div>
    </Card>
  )
}

export default ChartWidget
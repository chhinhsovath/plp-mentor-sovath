import React from 'react'
import { Card, Typography, Empty, Row, Col, Statistic } from 'antd'
import { TrendingUpOutlined, TrendingDownOutlined, LineChartOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface TrendAnalysisProps {
  data?: any[]
  title?: string
  loading?: boolean
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({
  data = [],
  title = 'Trend Analysis',
  loading = false,
}) => {
  const mockTrendData = [
    { period: 'Last Week', value: 85, change: '+5.2%', trend: 'up' },
    { period: 'Last Month', value: 78, change: '+12.8%', trend: 'up' },
    { period: 'Last Quarter', value: 92, change: '-2.1%', trend: 'down' },
  ]

  return (
    <Card title={title} loading={loading}>
      {data.length > 0 || mockTrendData.length > 0 ? (
        <Row gutter={[16, 16]}>
          {mockTrendData.map((item, index) => (
            <Col xs={24} sm={8} key={index}>
              <Card size="small">
                <Statistic
                  title={item.period}
                  value={item.value}
                  suffix="%"
                  prefix={
                    item.trend === 'up' ? 
                      <TrendingUpOutlined style={{ color: '#52c41a' }} /> :
                      <TrendingDownOutlined style={{ color: '#ff4d4f' }} />
                  }
                  valueStyle={{ 
                    color: item.trend === 'up' ? '#52c41a' : '#ff4d4f',
                    fontSize: '24px'
                  }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text 
                    style={{ 
                      color: item.trend === 'up' ? '#52c41a' : '#ff4d4f',
                      fontWeight: 'bold'
                    }}
                  >
                    {item.change}
                  </Text>
                  <Text type="secondary"> vs previous period</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          image={<LineChartOutlined style={{ fontSize: '48px', color: '#1890ff' }} />}
          description="No trend data available"
        />
      )}
    </Card>
  )
}

export default TrendAnalysis
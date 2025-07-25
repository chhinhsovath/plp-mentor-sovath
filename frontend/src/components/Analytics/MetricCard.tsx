import React from 'react'
import { Card, Statistic, Typography } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

const { Text } = Typography

interface MetricCardProps {
  title: string
  value: number | string
  suffix?: string
  prefix?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  loading?: boolean
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  suffix,
  prefix,
  trend = 'neutral',
  trendValue,
  loading = false,
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpOutlined style={{ color: '#52c41a' }} />
    if (trend === 'down') return <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
    return null
  }

  const getTrendColor = () => {
    if (trend === 'up') return '#52c41a'
    if (trend === 'down') return '#ff4d4f'
    return '#666'
  }

  return (
    <Card loading={loading}>
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {suffix}
            {trendValue && (
              <Text style={{ fontSize: '12px', color: getTrendColor() }}>
                {getTrendIcon()} {trendValue}
              </Text>
            )}
          </div>
        }
        valueStyle={{ fontSize: '28px', fontWeight: 'bold' }}
      />
    </Card>
  )
}

export default MetricCard
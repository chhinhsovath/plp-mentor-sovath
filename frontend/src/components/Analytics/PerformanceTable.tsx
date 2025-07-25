import React from 'react'
import { Table, Card } from 'antd'
import { useTranslation } from 'react-i18next'

interface PerformanceTableProps {
  data?: any[]
  loading?: boolean
  onRowClick?: (record: any) => void
}

const PerformanceTable: React.FC<PerformanceTableProps> = ({
  data = [],
  loading = false,
  onRowClick
}) => {
  const { t } = useTranslation()

  const columns = [
    {
      title: t('common.school'),
      dataIndex: 'school',
      key: 'school',
    },
    {
      title: t('common.performance'),
      dataIndex: 'performance',
      key: 'performance',
      render: (value: number) => `${value}%`
    },
    {
      title: t('common.observations'),
      dataIndex: 'observations',
      key: 'observations',
    },
  ]

  return (
    <Card title="Performance Table">
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        onRow={(record) => ({
          onClick: () => onRowClick?.(record)
        })}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  )
}

export default PerformanceTable
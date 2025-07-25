import React from 'react'
import { Card, Row, Col, Select, DatePicker, Button, Space } from 'antd'
import { FilterOutlined, ClearOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

interface FilterBarProps {
  onFilterChange?: (filters: any) => void
  onClear?: () => void
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange, onClear }) => {
  const { t } = useTranslation()

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={16} align="middle">
        <Col>
          <Space>
            <FilterOutlined />
            <span>Filters:</span>
          </Space>
        </Col>
        <Col>
          <Select
            placeholder="Select School"
            style={{ width: 150 }}
            allowClear
          >
            <Option value="school1">School 1</Option>
            <Option value="school2">School 2</Option>
          </Select>
        </Col>
        <Col>
          <RangePicker
            placeholder={['Start Date', 'End Date']}
            style={{ width: 220 }}
          />
        </Col>
        <Col>
          <Button
            icon={<ClearOutlined />}
            onClick={onClear}
          >
            Clear
          </Button>
        </Col>
      </Row>
    </Card>
  )
}

export default FilterBar
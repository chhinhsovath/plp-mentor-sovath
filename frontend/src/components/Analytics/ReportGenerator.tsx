import React, { useState } from 'react'
import { Card, Button, Select, DatePicker, Form, Space, Typography, message } from 'antd'
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

interface ReportGeneratorProps {
  onGenerate?: (config: any) => void
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ onGenerate }) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleGenerate = async (values: any) => {
    setLoading(true)
    try {
      console.log('Generating report with config:', values)
      if (onGenerate) {
        onGenerate(values)
      }
      message.success('Report generation started')
    } catch (error) {
      message.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title={
      <Space>
        <DownloadOutlined />
        <span>Report Generator</span>
      </Space>
    }>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleGenerate}
        initialValues={{
          reportType: 'summary',
          format: 'pdf',
          dateRange: [dayjs().subtract(30, 'days'), dayjs()],
        }}
      >
        <Form.Item
          name="reportType"
          label="Report Type"
          rules={[{ required: true, message: 'Please select a report type' }]}
        >
          <Select placeholder="Select report type">
            <Option value="summary">Summary Report</Option>
            <Option value="detailed">Detailed Report</Option>
            <Option value="performance">Performance Report</Option>
            <Option value="analytics">Analytics Report</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="Date Range"
          rules={[{ required: true, message: 'Please select a date range' }]}
        >
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="format"
          label="Export Format"
          rules={[{ required: true, message: 'Please select a format' }]}
        >
          <Select placeholder="Select format">
            <Option value="pdf">
              <Space>
                <FilePdfOutlined />
                PDF
              </Space>
            </Option>
            <Option value="excel">
              <Space>
                <FileExcelOutlined />
                Excel
              </Space>
            </Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<DownloadOutlined />}
            block
          >
            Generate Report
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default ReportGenerator
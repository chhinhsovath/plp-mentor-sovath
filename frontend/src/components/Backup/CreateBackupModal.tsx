import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
  TimePicker,
  Radio,
  Card,
  Steps,
  Button,
  Space,
  Typography,
  Alert,
  Divider,
  Tag,
  Row,
  Col
} from 'antd'
import {
  DatabaseOutlined,
  SecurityScanOutlined,
  CompressOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { CreateBackupRequest, BackupType } from '../../types/backup'
import backupService from '../../services/backup.service'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input
const { Text, Title } = Typography
const { Step } = Steps

interface CreateBackupModalProps {
  visible: boolean
  onCancel: () => void
  onSuccess: () => void
}

const CreateBackupModal: React.FC<CreateBackupModalProps> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  
  // Watch form field value changes
  const backupType = Form.useWatch('type', form)
  const enableSchedule = Form.useWatch('enableSchedule', form)
  const frequency = Form.useWatch('frequency', form)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setCurrentStep(0)
      setSelectedTables([])
      // Delay form reset to avoid warning
      setTimeout(() => {
        form.resetFields()
      }, 100)
    }
  }, [visible, form])

  const availableTables = [
    'users',
    'observations', 
    'schools',
    'teachers',
    'forms',
    'submissions',
    'analytics',
    'settings',
    'system_logs',
    'user_roles',
    'permissions'
  ]

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      
      const request: CreateBackupRequest = {
        name: values.name,
        description: values.description,
        type: values.type,
        includeData: values.includeData ?? true,
        includeSchema: values.includeSchema ?? true,
        compression: values.compression ?? false,
        encryption: values.encryption ?? false,
        tables: values.type === BackupType.CUSTOM ? selectedTables : undefined,
        schedule: values.enableSchedule ? {
          enabled: true,
          frequency: values.frequency,
          time: values.time?.format('HH:mm') || '02:00',
          daysOfWeek: values.frequency === 'weekly' ? values.daysOfWeek : undefined,
          dayOfMonth: values.frequency === 'monthly' ? values.dayOfMonth : undefined
        } : undefined
      }

      await backupService.createBackup(request)
      onSuccess()
    } catch (error) {
      console.error('Error creating backup:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onCancel()
  }

  const nextStep = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1)
    })
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const steps = [
    {
      title: t('backup.form.basicInfo'),
      icon: <DatabaseOutlined />
    },
    {
      title: t('backup.form.options'),
      icon: <SettingOutlined />
    },
    {
      title: t('backup.form.schedule'),
      icon: <ClockCircleOutlined />
    }
  ]

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Form.Item
              name="name"
              label={t('backup.form.name')}
              rules={[{ required: true, message: t('backup.form.validation.nameRequired') }]}
            >
              <Input placeholder={t('backup.form.namePlaceholder')} />
            </Form.Item>

            <Form.Item
              name="description"
              label={t('backup.form.description')}
              rules={[{ required: true, message: t('backup.form.validation.descriptionRequired') }]}
            >
              <TextArea 
                rows={3} 
                placeholder={t('backup.form.descriptionPlaceholder')} 
              />
            </Form.Item>

            <Form.Item
              name="type"
              label={t('backup.form.type')}
              rules={[{ required: true, message: t('backup.form.validation.typeRequired') }]}
            >
              <Select placeholder={t('backup.form.type')}>
                <Option value={BackupType.FULL}>
                  <Space>
                    <DatabaseOutlined />
                    {t('backup.types.full')}
                  </Space>
                </Option>
                <Option value={BackupType.INCREMENTAL}>
                  <Space>
                    <DatabaseOutlined />
                    {t('backup.types.incremental')}
                  </Space>
                </Option>
                <Option value={BackupType.DIFFERENTIAL}>
                  <Space>
                    <DatabaseOutlined />
                    {t('backup.types.differential')}
                  </Space>
                </Option>
                <Option value={BackupType.CUSTOM}>
                  <Space>
                    <CheckSquareOutlined />
                    {t('backup.types.custom')}
                  </Space>
                </Option>
              </Select>
            </Form.Item>

            {backupType === BackupType.CUSTOM && (
              <Form.Item label={t('backup.form.selectTables')}>
                <Card size="small">
                  <Checkbox.Group
                    value={selectedTables}
                    onChange={setSelectedTables}
                    style={{ width: '100%' }}
                  >
                    <Row gutter={[8, 8]}>
                      {availableTables.map(table => (
                        <Col span={8} key={table}>
                          <Checkbox value={table}>
                            <Text style={{ fontSize: 12 }}>{table}</Text>
                          </Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                  <Divider style={{ margin: '12px 0 8px 0' }} />
                  <Space>
                    <Button
                      size="small"
                      onClick={() => setSelectedTables(availableTables)}
                    >
                      {t('backup.form.allTables')}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setSelectedTables([])}
                    >
                      {t('common.clear')}
                    </Button>
                  </Space>
                </Card>
              </Form.Item>
            )}
          </div>
        )

      case 1:
        return (
          <div>
            <Alert
              message={t('backup.form.options')}
              description="ជ្រើសរើសជម្រើសបន្ថែមសម្រាប់ការបេកអាប់របស់អ្នក"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Card title="ទិន្នន័យនិងរចនាសម្ព័ន្ធ" size="small" style={{ marginBottom: 16 }}>
              <Form.Item name="includeData" valuePropName="checked" initialValue={true}>
                <Checkbox>
                  <Space>
                    <DatabaseOutlined />
                    {t('backup.form.includeData')}
                  </Space>
                </Checkbox>
              </Form.Item>
              <Form.Item name="includeSchema" valuePropName="checked" initialValue={true}>
                <Checkbox>
                  <Space>
                    <SettingOutlined />
                    {t('backup.form.includeSchema')}
                  </Space>
                </Checkbox>
              </Form.Item>
            </Card>

            <Card title="ជម្រើសសុវត្ថិភាព" size="small">
              <Form.Item name="compression" valuePropName="checked">
                <Checkbox>
                  <Space>
                    <CompressOutlined />
                    {t('backup.form.compression')}
                  </Space>
                </Checkbox>
              </Form.Item>
              <Form.Item name="encryption" valuePropName="checked">
                <Checkbox>
                  <Space>
                    <SecurityScanOutlined />
                    {t('backup.form.encryption')}
                  </Space>
                </Checkbox>
              </Form.Item>
            </Card>
          </div>
        )

      case 2:
        return (
          <div>
            <Form.Item name="enableSchedule" valuePropName="checked">
              <Checkbox>
                <Space>
                  <ClockCircleOutlined />
                  {t('backup.form.enableSchedule')}
                </Space>
              </Checkbox>
            </Form.Item>

            {enableSchedule && (
              <Card title={t('backup.form.schedule')} size="small">
                <Form.Item
                  name="frequency"
                  label={t('backup.form.frequency')}
                  initialValue="daily"
                >
                  <Radio.Group>
                    <Radio value="daily">{t('backup.frequency.daily')}</Radio>
                    <Radio value="weekly">{t('backup.frequency.weekly')}</Radio>
                    <Radio value="monthly">{t('backup.frequency.monthly')}</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  name="time"
                  label={t('backup.form.time')}
                  initialValue={dayjs('02:00', 'HH:mm')}
                >
                  <TimePicker 
                    format="HH:mm" 
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                {frequency === 'weekly' && (
                  <Form.Item
                    name="daysOfWeek"
                    label="ថ្ងៃនៃអាទិត្យ"
                  >
                    <Checkbox.Group>
                      <Row>
                        <Col span={8}><Checkbox value={1}>ច័ន្ទ</Checkbox></Col>
                        <Col span={8}><Checkbox value={2}>អង្គារ</Checkbox></Col>
                        <Col span={8}><Checkbox value={3}>ពុធ</Checkbox></Col>
                        <Col span={8}><Checkbox value={4}>ព្រហស្បតិ៍</Checkbox></Col>
                        <Col span={8}><Checkbox value={5}>សុក្រ</Checkbox></Col>
                        <Col span={8}><Checkbox value={6}>សៅរ៍</Checkbox></Col>
                        <Col span={8}><Checkbox value={0}>អាទិត្យ</Checkbox></Col>
                      </Row>
                    </Checkbox.Group>
                  </Form.Item>
                )}

                {frequency === 'monthly' && (
                  <Form.Item
                    name="dayOfMonth"
                    label="ថ្ងៃនៃខែ"
                    initialValue={1}
                  >
                    <Select style={{ width: '100%' }}>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <Option key={day} value={day}>ថ្ងៃទី {day}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}
              </Card>
            )}

            <Alert
              message="ចំណាំ"
              description="ការបេកអាប់នឹងដំណើរការជាស្វ័យប្រវត្តិតាមកាលវិភាគដែលបានកំណត់។ អ្នកអាចកែប្រែឬបិទកាលវិភាគនេះនៅពេលក្រោយ។"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Modal
      title={t('backup.createNew')}
      open={visible}
      onCancel={handleCancel}
      width={700}
      footer={null}
      destroyOnHidden
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((step, index) => (
          <Step key={index} title={step.title} icon={step.icon} />
        ))}
      </Steps>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        scrollToFirstError
      >
        {renderStepContent()}

        <Divider />

        <div style={{ textAlign: 'right' }}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={prevStep}>
                {t('common.back')}
              </Button>
            )}
            <Button onClick={handleCancel}>
              {t('common.cancel')}
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={nextStep}>
                {t('common.next')}
              </Button>
            ) : (
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<DatabaseOutlined />}
              >
                {t('backup.create')}
              </Button>
            )}
          </Space>
        </div>
      </Form>
    </Modal>
  )
}

export default CreateBackupModal
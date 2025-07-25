import React, { useState } from 'react'
import {
  Modal,
  Form,
  Input,
  Checkbox,
  Card,
  Alert,
  Space,
  Typography,
  Descriptions,
  Progress,
  Result,
  Button,
  Divider
} from 'antd'
import {
  HistoryOutlined,
  DatabaseOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { BackupItem, RestoreBackupRequest } from '../../types/backup'
import backupService from '../../services/backup.service'
import { formatDate } from '../../utils/dateUtils'

const { Text, Title } = Typography

interface RestoreBackupModalProps {
  visible: boolean
  backup: BackupItem | null
  onCancel: () => void
  onSuccess: () => void
}

const RestoreBackupModal: React.FC<RestoreBackupModalProps> = ({
  visible,
  backup,
  onCancel,
  onSuccess
}) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [restoreStep, setRestoreStep] = useState<'confirm' | 'progress' | 'success' | 'error'>('confirm')
  const [restoreProgress, setRestoreProgress] = useState(0)

  const handleRestore = async (values: any) => {
    if (!backup) return

    try {
      setLoading(true)
      setRestoreStep('progress')
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setRestoreProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + Math.random() * 10
        })
      }, 200)

      const request: RestoreBackupRequest = {
        backupId: backup.id,
        restoreOptions: {
          overwriteExisting: values.overwrite ?? false,
          restoreData: values.restoreData ?? true,
          restoreSchema: values.restoreSchema ?? true,
          targetDatabase: values.targetDatabase || 'current'
        }
      }

      await backupService.restoreBackup(request)
      
      clearInterval(progressInterval)
      setRestoreProgress(100)
      setRestoreStep('success')
      
      setTimeout(() => {
        onSuccess()
        handleCancel()
      }, 2000)
      
    } catch (error) {
      console.error('Error restoring backup:', error)
      setRestoreStep('error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setRestoreStep('confirm')
    setRestoreProgress(0)
    onCancel()
  }

  const renderConfirmStep = () => (
    <div>
      {backup && (
        <>
          <Alert
            message={t('backup.restore.warning')}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Card title="ព័ត៌មានការបេកអាប់" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t('backup.table.name')}>
                <Space>
                  <DatabaseOutlined style={{ color: '#1890ff' }} />
                  <Text strong>{backup.name}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t('backup.form.description')}>
                {backup.description}
              </Descriptions.Item>
              <Descriptions.Item label={t('backup.table.type')}>
                {t(`backup.types.${backup.type}`)}
              </Descriptions.Item>
              <Descriptions.Item label={t('backup.table.size')}>
                {backupService.formatFileSize(backup.size)}
              </Descriptions.Item>
              <Descriptions.Item label={t('backup.table.created')}>
                {formatDate(backup.createdAt)} {backup.createdAt.toLocaleTimeString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleRestore}
          >
            <Card title={t('backup.restore.options')} size="small">
              <Form.Item name="restoreData" valuePropName="checked" initialValue={true}>
                <Checkbox>
                  <Space>
                    <DatabaseOutlined />
                    {t('backup.restore.restoreData')}
                  </Space>
                </Checkbox>
              </Form.Item>
              
              <Form.Item name="restoreSchema" valuePropName="checked" initialValue={true}>
                <Checkbox>
                  <Space>
                    <SettingOutlined />
                    {t('backup.restore.restoreSchema')}
                  </Space>
                </Checkbox>
              </Form.Item>
              
              <Form.Item name="overwrite" valuePropName="checked">
                <Checkbox>
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                    {t('backup.restore.overwrite')}
                  </Space>
                </Checkbox>
              </Form.Item>
              
              <Form.Item
                name="targetDatabase"
                label={t('backup.restore.targetDatabase')}
              >
                <Input placeholder="current (ពោលគេទុកជាប្រព័ន្ធបច្ចុប្បន្ន)" />
              </Form.Item>
            </Card>

            <Alert
              message="ចំណាំសំខាន់"
              description="ការស្ដារនេះនឹងជំនួសទិន្នន័យដែលមានស្រាប់។ សូមប្រាកដថាអ្នកបានបេកអាប់ទិន្នន័យបច្ចុប្បន្នរបស់អ្នករួចរាល់។"
              type="error"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Form>
        </>
      )}
    </div>
  )

  const renderProgressStep = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <LoadingOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
      <Title level={4}>{t('backup.restore.inProgress')}</Title>
      <Progress 
        percent={Math.round(restoreProgress)} 
        status="active"
        strokeColor={{
          '0%': '#108ee9',
          '100%': '#87d068',
        }}
        style={{ margin: '24px 0' }}
      />
      <Text type="secondary">សូមរង់ចាំ ការស្ដារកំពុងដំណើរការ...</Text>
      
      <div style={{ marginTop: 24, textAlign: 'left' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {restoreProgress < 30 ? '🔍 កំពុងវិភាគឯកសារបេកអាប់...' :
           restoreProgress < 60 ? '📊 កំពុងស្ដាររចនាសម្ព័ន្ធទិន្នន័យ...' :
           restoreProgress < 90 ? '💾 កំពុងស្ដារទិន្នន័យ...' :
           '✅ កំពុងបញ្ចប់ការស្ដារ...'}
        </Text>
      </div>
    </div>
  )

  const renderSuccessStep = () => (
    <Result
      status="success"
      title={t('backup.restore.success')}
      subTitle="ទិន្នន័យត្រូវបានស្ដារដោយជោគជ័យ។ ការផ្លាស់ប្តូរទាំងអស់នឹងមានប្រសិទ្ធភាពភ្លាមៗ។"
      icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
      extra={[
        <Space key="actions" style={{ marginTop: 16 }}>
          <Text type="secondary">បិទដោយស្វ័យប្រវត្តិក្នុងពេល 2 វិនាទី...</Text>
        </Space>
      ]}
    />
  )

  const renderErrorStep = () => (
    <Result
      status="error"
      title={t('backup.restore.failed')}
      subTitle="មានបញ្ហាក្នុងការស្ដារទិន្នន័យ។ សូមពិនិត្យមើលឯកសារបេកអាប់ និងព្យាយាមម្តងទៀត។"
      icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
      extra={[
        <Button key="retry" type="primary" onClick={() => setRestoreStep('confirm')}>
          ព្យាយាមម្តងទៀត
        </Button>
      ]}
    />
  )

  const renderContent = () => {
    switch (restoreStep) {
      case 'confirm':
        return renderConfirmStep()
      case 'progress':
        return renderProgressStep()
      case 'success':
        return renderSuccessStep()
      case 'error':
        return renderErrorStep()
      default:
        return renderConfirmStep()
    }
  }

  const getModalTitle = () => {
    switch (restoreStep) {
      case 'progress':
        return t('backup.restore.inProgress')
      case 'success':
        return t('backup.restore.success')
      case 'error':
        return t('backup.restore.failed')
      default:
        return t('backup.restore.title')
    }
  }

  const getFooter = () => {
    if (restoreStep === 'progress' || restoreStep === 'success') {
      return null
    }
    
    if (restoreStep === 'error') {
      return [
        <Button key="cancel" onClick={handleCancel}>
          {t('common.close')}
        </Button>
      ]
    }

    return [
      <Button key="cancel" onClick={handleCancel}>
        {t('common.cancel')}
      </Button>,
      <Button
        key="restore"
        type="primary"
        danger
        loading={loading}
        icon={<HistoryOutlined />}
        onClick={() => form.submit()}
      >
        {t('backup.restore.confirm')}
      </Button>
    ]
  }

  return (
    <Modal
      title={getModalTitle()}
      open={visible}
      onCancel={handleCancel}
      width={600}
      footer={getFooter()}
      destroyOnHidden
      closable={restoreStep !== 'progress'}
      maskClosable={false}
    >
      {renderContent()}
    </Modal>
  )
}

export default RestoreBackupModal
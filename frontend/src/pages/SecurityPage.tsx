import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Space,
  Input,
  Select,
  DatePicker,
  Tag,
  Typography,
  Statistic,
  Progress,
  Modal,
  message,
  Popconfirm,
  Tooltip,
  Alert,
  Empty,
  Tabs,
  Badge,
  Switch,
  Form,
  InputNumber,
  Divider,
  List,
  Avatar
} from 'antd'
import {
  SecurityScanOutlined,
  SafetyOutlined,
  EyeOutlined,
  LockOutlined,
  UserOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  MonitorOutlined,
  DatabaseOutlined,
  KeyOutlined,
  GlobalOutlined,
  TeamOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  BellOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  StopOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { ColumnsType } from 'antd/es/table'
import { 
  SecuritySettings, 
  SecurityEvent, 
  UserSession, 
  SecurityStats,
  SecurityAlert,
  SecurityEventType,
  SecuritySeverity
} from '../types/security'
import securityService from '../services/security.service'
import { formatDate } from '../utils/dateUtils'
import './SecurityPage.css'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

interface TabItem {
  key: string;
  label: React.ReactNode;
  children: React.ReactNode;
}

const SecurityPage: React.FC = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [settings, setSettings] = useState<SecuritySettings | null>(null)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState<number>(0)
  const [scanRunning, setScanRunning] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchData()
  }, [])

  // Set form values when settings are loaded AND settings tab is active
  useEffect(() => {
    if (settings && form && activeTab === 'settings') {
      // Use setTimeout to ensure form is mounted in DOM
      setTimeout(() => {
        form.setFieldsValue(settings)
      }, 0)
    }
  }, [settings, form, activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [
        settingsData,
        eventsData,
        sessionsData,
        statsData,
        alertsData
      ] = await Promise.all([
        securityService.getSecuritySettings(),
        securityService.getSecurityEvents({ limit: 20 }),
        securityService.getActiveSessions(),
        securityService.getSecurityStats(),
        securityService.getSecurityAlerts()
      ])
      
      setSettings(settingsData)
      setEvents(eventsData)
      setSessions(sessionsData)
      setStats(statsData)
      setAlerts(alertsData)
    } catch (error) {
      console.error('Error fetching security data:', error)
      message.error(t('security.messages.settingsUpdateFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSettingsUpdate = async (values: any) => {
    try {
      setActionLoading('settings')
      await securityService.updateSecuritySettings(values)
      message.success(t('security.messages.settingsUpdated'))
      fetchData()
    } catch (error) {
      message.error(t('security.messages.settingsUpdateFailed'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleTerminateSession = async (sessionId: string) => {
    try {
      setActionLoading(sessionId)
      await securityService.terminateSession(sessionId)
      message.success(t('security.messages.sessionTerminated'))
      fetchData()
    } catch (error) {
      message.error(t('security.messages.sessionTerminateFailed'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleTerminateAllSessions = async () => {
    try {
      setActionLoading('all-sessions')
      await securityService.terminateAllSessions()
      message.success(t('security.messages.sessionTerminated'))
      fetchData()
    } catch (error) {
      message.error(t('security.messages.sessionTerminateFailed'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleAcknowledgeEvent = async (eventId: string) => {
    try {
      setActionLoading(eventId)
      await securityService.acknowledgeSecurityEvent(eventId)
      message.success(t('security.messages.eventAcknowledged'))
      fetchData()
    } catch (error) {
      message.error(t('security.messages.settingsUpdateFailed'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleRunSecurityScan = async (type: 'vulnerability' | 'penetration' | 'compliance') => {
    try {
      setScanRunning(true)
      setScanProgress(0)
      message.info(t('security.messages.scanStarted'))
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + Math.random() * 10
        })
      }, 500)

      await securityService.runSecurityScan(type)
      
      clearInterval(progressInterval)
      setScanProgress(100)
      message.success(t('security.scans.completed'))
      
      setTimeout(() => {
        setScanRunning(false)
        setScanProgress(0)
        fetchData()
      }, 1500)
    } catch (error) {
      message.error(t('security.messages.scanFailed'))
      setScanRunning(false)
      setScanProgress(0)
    }
  }

  const getSeverityColor = (severity: SecuritySeverity): string => {
    return securityService.getSeverityColor(severity)
  }

  const getSeverityTag = (severity: SecuritySeverity) => {
    return (
      <Tag color={getSeverityColor(severity)}>
        {securityService.getSeverityIcon(severity)} {t(`security.events.severity.${severity}`)}
      </Tag>
    )
  }

  const getEventTypeTag = (type: SecurityEventType) => {
    const colors = {
      [SecurityEventType.LOGIN_SUCCESS]: 'green',
      [SecurityEventType.LOGIN_FAILED]: 'red',
      [SecurityEventType.PASSWORD_CHANGED]: 'blue',
      [SecurityEventType.ACCOUNT_LOCKED]: 'orange',
      [SecurityEventType.SUSPICIOUS_ACTIVITY]: 'purple',
      [SecurityEventType.UNAUTHORIZED_ACCESS]: 'red',
      [SecurityEventType.DATA_BREACH_ATTEMPT]: 'red',
      [SecurityEventType.SYSTEM_VULNERABILITY]: 'orange',
      [SecurityEventType.PERMISSION_ESCALATION]: 'red',
      [SecurityEventType.SESSION_HIJACK_ATTEMPT]: 'red'
    }

    return (
      <Tag color={colors[type]}>
        {t(`security.events.types.${type.replace('_', '')}`)}
      </Tag>
    )
  }

  const eventColumns: ColumnsType<SecurityEvent> = [
    {
      title: t('security.events.type'),
      dataIndex: 'type',
      key: 'type',
      width: 180,
      render: (type: SecurityEventType) => getEventTypeTag(type)
    },
    {
      title: t('security.events.severityTitle'),
      dataIndex: 'severity',
      key: 'severity',
      width: 120,
      align: 'center',
      render: (severity: SecuritySeverity) => getSeverityTag(severity)
    },
    {
      title: t('security.events.timestamp'),
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
      render: (date: Date) => (
        <div>
          <div>{formatDate(date)}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {date.toLocaleTimeString()}
          </Text>
        </div>
      )
    },
    {
      title: t('security.events.user'),
      dataIndex: 'userEmail',
      key: 'user',
      width: 180,
      render: (email: string) => (
        <Space>
          <UserOutlined />
          <Text>{email || 'N/A'}</Text>
        </Space>
      )
    },
    {
      title: t('security.events.ip'),
      dataIndex: 'ipAddress',
      key: 'ip',
      width: 120,
      render: (ip: string) => (
        <Text code style={{ fontSize: 11 }}>{ip}</Text>
      )
    },
    {
      title: t('security.events.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'red', icon: <WarningOutlined /> },
          resolved: { color: 'green', icon: <CheckCircleOutlined /> },
          ignored: { color: 'default', icon: <ExclamationCircleOutlined /> }
        }
        const config = statusConfig[status as keyof typeof statusConfig]
        return (
          <Tag color={config.color} icon={config.icon}>
            {t(`security.events.${status}`)}
          </Tag>
        )
      }
    },
    {
      title: t('security.events.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record: SecurityEvent) => (
        <Space>
          <Tooltip title={t('security.events.acknowledge')}>
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => handleAcknowledgeEvent(record.id)}
              loading={actionLoading === record.id}
              disabled={record.status !== 'active'}
              size="small"
            />
          </Tooltip>
          <Tooltip title={t('security.events.details')}>
            <Button
              type="link"
              icon={<EyeOutlined />}
              size="small"
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const sessionColumns: ColumnsType<UserSession> = [
    {
      title: t('security.sessions.user'),
      dataIndex: 'userEmail',
      key: 'user',
      width: 180,
      render: (email: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{email}</Text>
        </Space>
      )
    },
    {
      title: t('security.sessions.device'),
      dataIndex: 'device',
      key: 'device',
      width: 150,
      render: (device: string) => (
        <Text type="secondary">{device}</Text>
      )
    },
    {
      title: t('security.sessions.location'),
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (location: string) => (
        <Space>
          <GlobalOutlined />
          <Text>{location}</Text>
        </Space>
      )
    },
    {
      title: t('security.sessions.started'),
      dataIndex: 'startTime',
      key: 'started',
      width: 140,
      render: (date: Date) => (
        <Text type="secondary">{formatDate(date)}</Text>
      )
    },
    {
      title: t('security.sessions.duration'),
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      render: (duration: number) => (
        <Text>{securityService.formatDuration(duration)}</Text>
      )
    },
    {
      title: t('security.events.actions'),
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record: UserSession) => (
        <Popconfirm
          title={t('security.messages.confirmTerminateSession')}
          onConfirm={() => handleTerminateSession(record.id)}
          okText={t('common.yes')}
          cancelText={t('common.no')}
        >
          <Button
            type="link"
            danger
            icon={<StopOutlined />}
            loading={actionLoading === record.id}
            size="small"
          />
        </Popconfirm>
      )
    }
  ]

  return (
    <div className="security-page">
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                <SafetyOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                {t('security.title')}
              </Title>
              <Text type="secondary">
                {t('security.subtitle')}
              </Text>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchData}
                  loading={loading}
                >
                  {t('common.refresh')}
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

      {/* Stats Cards */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" variant="borderless">
              <Statistic
                title={t('security.stats.totalEvents')}
                value={stats.totalEvents}
                prefix={<AuditOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" variant="borderless">
              <Statistic
                title={t('security.stats.criticalEvents')}
                value={stats.criticalEvents}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" variant="borderless">
              <Statistic
                title={t('security.stats.activeSessions')}
                value={stats.activeSessions}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" variant="borderless">
              <Statistic
                title={t('security.stats.complianceScore')}
                value={stats.complianceScore}
                suffix="%"
                prefix={<SafetyCertificateOutlined />}
                valueStyle={{ color: stats.complianceScore >= 80 ? '#52c41a' : '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Security Alerts */}
      {alerts.length > 0 && (
        <Alert
          message={`${alerts.length} ${t('security.alerts.newAlert')}`}
          description={
            <List
              size="small"
              dataSource={alerts.slice(0, 3)}
              renderItem={(alert) => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => alert.actions?.[0]?.handler()}
                    >
                      {t('security.alerts.acknowledge')}
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Text>{securityService.getSeverityIcon(alert.severity)}</Text>}
                    title={alert.title}
                    description={alert.message}
                  />
                </List.Item>
              )}
            />
          }
          type="warning"
          showIcon
          closable
          style={{ marginTop: 16 }}
        />
      )}

      {/* Main Content Tabs */}
      <div style={{ marginTop: 16 }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: (
                <Space>
                  <MonitorOutlined />
                  {t('security.overview')}
                </Space>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card 
                      title={
                        <Space>
                          <WarningOutlined style={{ color: '#ff4d4f' }} />
                          {t('security.events.title')}
                        </Space>
                      }
                      extra={
                        <Badge count={events.filter(e => e.status === 'active').length}>
                          <Button type="link">{t('common.viewAll')}</Button>
                        </Badge>
                      }
                      size="small"
                    >
                      <Table
                        columns={eventColumns.slice(0, 4)}
                        dataSource={events.slice(0, 5)}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card 
                      title={
                        <Space>
                          <UserOutlined style={{ color: '#52c41a' }} />
                          {t('security.sessions.active')}
                        </Space>
                      }
                      extra={
                        <Popconfirm
                          title={t('security.messages.confirmTerminateAllSessions')}
                          onConfirm={handleTerminateAllSessions}
                          okText={t('common.yes')}
                          cancelText={t('common.no')}
                        >
                          <Button 
                            type="link" 
                            danger 
                            size="small"
                            loading={actionLoading === 'all-sessions'}
                          >
                            {t('security.sessions.terminateAll')}
                          </Button>
                        </Popconfirm>
                      }
                      size="small"
                    >
                      <List
                        size="small"
                        dataSource={sessions.slice(0, 5)}
                        renderItem={(session) => (
                          <List.Item
                            actions={[
                              <Popconfirm
                                title={t('security.sessions.terminateConfirm')}
                                onConfirm={() => handleTerminateSession(session.id)}
                              >
                                <Button 
                                  type="link" 
                                  danger 
                                  size="small"
                                  icon={<StopOutlined />}
                                  loading={actionLoading === session.id}
                                />
                              </Popconfirm>
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<Avatar size="small" icon={<UserOutlined />} />}
                              title={session.userEmail}
                              description={`${session.device} - ${session.location}`}
                            />
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              key: 'settings',
              label: (
                <Space>
                  <SettingOutlined />
                  {t('security.settings')}
                </Space>
              ),
              children: settings ? (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSettingsUpdate}
                >
                  <Row gutter={[24, 24]}>
                    {/* Authentication Settings */}
                    <Col xs={24} lg={12}>
                      <Card 
                        title={
                          <Space>
                            <KeyOutlined style={{ color: '#1890ff' }} />
                            {t('security.authentication.title')}
                          </Space>
                        }
                        size="small"
                      >
                        <Form.Item 
                          name={['authentication', 'twoFactorEnabled']} 
                          valuePropName="checked"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text>{t('security.authentication.twoFactor')}</Text>
                            <Switch />
                          </div>
                        </Form.Item>
                        
                        <Form.Item 
                          name={['authentication', 'biometricEnabled']} 
                          valuePropName="checked"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text>{t('security.authentication.biometric')}</Text>
                            <Switch />
                          </div>
                        </Form.Item>

                        <Form.Item
                          name={['authentication', 'sessionTimeout']}
                          label={t('security.authentication.sessionTimeout')}
                        >
                          <InputNumber
                            min={15}
                            max={480}
                            addonAfter={t('security.form.minutes')}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>

                        <Form.Item
                          name={['authentication', 'maxLoginAttempts']}
                          label={t('security.authentication.maxAttempts')}
                        >
                          <InputNumber
                            min={3}
                            max={10}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Card>
                    </Col>

                    {/* Password Policy */}
                    <Col xs={24} lg={12}>
                      <Card 
                        title={
                          <Space>
                            <LockOutlined style={{ color: '#faad14' }} />
                            {t('security.password.title')}
                          </Space>
                        }
                        size="small"
                      >
                        <Form.Item
                          name={['passwordPolicy', 'minLength']}
                          label={t('security.password.minLength')}
                        >
                          <InputNumber
                            min={6}
                            max={32}
                            addonAfter={t('security.form.characters')}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>

                        <Form.Item 
                          name={['passwordPolicy', 'requireUppercase']} 
                          valuePropName="checked"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text>{t('security.password.uppercase')}</Text>
                            <Switch />
                          </div>
                        </Form.Item>

                        <Form.Item 
                          name={['passwordPolicy', 'requireNumbers']} 
                          valuePropName="checked"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text>{t('security.password.numbers')}</Text>
                            <Switch />
                          </div>
                        </Form.Item>

                        <Form.Item 
                          name={['passwordPolicy', 'requireSpecialChars']} 
                          valuePropName="checked"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text>{t('security.password.specialChars')}</Text>
                            <Switch />
                          </div>
                        </Form.Item>
                      </Card>
                    </Col>

                    {/* Monitoring Settings */}
                    <Col xs={24} lg={12}>
                      <Card 
                        title={
                          <Space>
                            <MonitorOutlined style={{ color: '#52c41a' }} />
                            {t('security.monitoring.title')}
                          </Space>
                        }
                        size="small"
                      >
                        <Form.Item 
                          name={['monitoring', 'auditLogging']} 
                          valuePropName="checked"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text>{t('security.monitoring.auditLogging')}</Text>
                            <Switch />
                          </div>
                        </Form.Item>

                        <Form.Item 
                          name={['monitoring', 'realTimeMonitoring']} 
                          valuePropName="checked"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text>{t('security.monitoring.realTimeMonitoring')}</Text>
                            <Switch />
                          </div>
                        </Form.Item>

                        <Form.Item 
                          name={['monitoring', 'suspiciousActivityDetection']} 
                          valuePropName="checked"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text>{t('security.monitoring.suspiciousDetection')}</Text>
                            <Switch />
                          </div>
                        </Form.Item>

                        <Form.Item
                          name={['monitoring', 'retentionPeriod']}
                          label={t('security.monitoring.retentionPeriod')}
                        >
                          <InputNumber
                            min={30}
                            max={2555}
                            addonAfter={t('security.form.days')}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Card>
                    </Col>

                    {/* Data Protection */}
                    <Col xs={24} lg={12}>
                      <Card 
                        title={
                          <Space>
                            <FileProtectOutlined style={{ color: '#722ed1' }} />
                            {t('security.dataProtection.title')}
                          </Space>
                        }
                        size="small"
                      >
                        <Form.Item 
                          name={['dataProtection', 'encryption', 'dataAtRest']} 
                          valuePropName="checked"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text>{t('security.dataProtection.dataAtRest')}</Text>
                          <Switch />
                        </div>
                      </Form.Item>

                      <Form.Item 
                        name={['dataProtection', 'encryption', 'dataInTransit']} 
                        valuePropName="checked"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text>{t('security.dataProtection.dataInTransit')}</Text>
                          <Switch />
                        </div>
                      </Form.Item>

                      <Form.Item 
                        name={['dataProtection', 'gdprCompliance']} 
                        valuePropName="checked"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text>{t('security.dataProtection.gdprCompliance')}</Text>
                          <Switch />
                        </div>
                      </Form.Item>
                    </Card>
                  </Col>
                </Row>

                <Divider />

                <Row justify="end">
                  <Space>
                    <Button onClick={() => form.resetFields()}>
                      {t('security.form.reset')}
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={actionLoading === 'settings'}
                      icon={<SettingOutlined />}
                    >
                      {t('security.form.save')}
                    </Button>
                  </Space>
                </Row>
              </Form>
            ) : null
          },
          {
            key: 'events',
            label: (
              <Space>
                <WarningOutlined />
                {t('security.eventsTitle')}
                {events.filter(e => e.status === 'active').length > 0 && (
                  <Badge count={events.filter(e => e.status === 'active').length} size="small" />
                )}
              </Space>
            ),
            children: (
              <Table
                columns={eventColumns}
                dataSource={events}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `បង្ហាញ ${range[0]}-${range[1]} នៃ ${total} ព្រឹត្តិការណ៍`,
                  pageSizeOptions: ['5', '10', '20', '50']
                }}
                scroll={{ x: 1000 }}
                loading={loading}
              />
            )
          },
          {
            key: 'sessions',
            label: (
              <Space>
                <UserOutlined />
                {t('security.sessionsTitle')}
                {sessions.length > 0 && (
                  <Badge count={sessions.length} size="small" />
                )}
              </Space>
            ),
            children: (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Alert
                    message={`${sessions.length} ${t('security.sessions.active')}`}
                    description={t('security.messages.noActiveSessions')}
                    type="info"
                    showIcon
                    action={
                      <Popconfirm
                        title={t('security.messages.confirmTerminateAllSessions')}
                        onConfirm={handleTerminateAllSessions}
                      >
                        <Button 
                          size="small" 
                          danger
                          loading={actionLoading === 'all-sessions'}
                        >
                          {t('security.sessions.terminateAll')}
                        </Button>
                      </Popconfirm>
                    }
                  />
                </div>

                <Table
                  columns={sessionColumns}
                  dataSource={sessions}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `បង្ហាញ ${range[0]}-${range[1]} នៃ ${total} សម័យ`,
                  }}
                  loading={loading}
                />
              </>
            )
          },
          {
            key: 'scans',
            label: (
              <Space>
                <SecurityScanOutlined />
                {t('security.scansTitle')}
              </Space>
            ),
            children: (
              <>
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={8}>
                    <Card 
                      title={t('security.scans.vulnerability')}
                      size="small"
                      actions={[
                        <Button
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={() => handleRunSecurityScan('vulnerability')}
                          loading={scanRunning}
                          disabled={scanRunning}
                        >
                          {t('security.scans.runScan')}
                        </Button>
                      ]}
                    >
                      <Text type="secondary">
                        ស្កេនរកភាពងាយរងគ្រោះនៅក្នុងប្រព័ន្ធ
                      </Text>
                    </Card>
                  </Col>
                  
                  <Col xs={24} lg={8}>
                    <Card 
                      title={t('security.scans.penetration')}
                      size="small"
                      actions={[
                        <Button
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={() => handleRunSecurityScan('penetration')}
                          loading={scanRunning}
                          disabled={scanRunning}
                        >
                          {t('security.scans.runScan')}
                        </Button>
                      ]}
                    >
                      <Text type="secondary">
                        តេស្តការជ្រាបចូលនិងការពារសុវត្ថិភាព
                      </Text>
                    </Card>
                  </Col>

                  <Col xs={24} lg={8}>
                    <Card 
                      title={t('security.scans.compliance')}
                      size="small"
                      actions={[
                        <Button
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={() => handleRunSecurityScan('compliance')}
                          loading={scanRunning}
                          disabled={scanRunning}
                        >
                          {t('security.scans.runScan')}
                        </Button>
                      ]}
                    >
                      <Text type="secondary">
                        ពិនិត្យការអនុលោមតាមស្តង់ដារសុវត្ថិភាព
                      </Text>
                    </Card>
                  </Col>
                </Row>

                {scanRunning && (
                  <Card style={{ marginTop: 16 }} size="small">
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <SecurityScanOutlined 
                        style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} 
                      />
                      <Title level={4}>{t('security.scans.running')}</Title>
                      <Progress 
                        percent={Math.round(scanProgress)} 
                        status="active"
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                        style={{ margin: '24px 0' }}
                      />
                      <Text type="secondary">កំពុងវិភាគសុវត្ថិភាពប្រព័ន្ធ...</Text>
                    </div>
                  </Card>
                )}

                {stats && stats.lastSecurityScan && (
                  <Card style={{ marginTop: 16 }} size="small">
                    <Text type="secondary">
                      {t('security.scans.lastScan')}: {formatDate(stats.lastSecurityScan)}
                    </Text>
                  </Card>
                )}
              </>
            )
          }
        ]}
        />
      </div>
      </div>
    </div>
  )
}

export default SecurityPage
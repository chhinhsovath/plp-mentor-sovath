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
  Spin,
  Drawer,
  Descriptions
} from 'antd'
import {
  DatabaseOutlined,
  CloudDownloadOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExportOutlined,
  PlusOutlined,
  FilterOutlined,
  DownloadOutlined,
  HistoryOutlined,
  SecurityScanOutlined,
  CompressOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  FileProtectOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { ColumnsType } from 'antd/es/table'
import { BackupItem, BackupFilters, BackupStats, BackupType, BackupStatus } from '../types/backup'
import backupService from '../services/backup.service'
import { formatDate } from '../utils/dateUtils'
import CreateBackupModal from '../components/Backup/CreateBackupModal'
import RestoreBackupModal from '../components/Backup/RestoreBackupModal'
import './BackupPage.css'

const { Title, Text } = Typography
const { Search } = Input
const { RangePicker } = DatePicker
const { Option } = Select

const BackupPage: React.FC = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [backups, setBackups] = useState<BackupItem[]>([])
  const [filteredBackups, setFilteredBackups] = useState<BackupItem[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [filters, setFilters] = useState<BackupFilters>({})
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [backups, filters])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [backupsData, statsData] = await Promise.all([
        backupService.getAllBackups(filters),
        backupService.getBackupStats()
      ])
      setBackups(backupsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching backup data:', error)
      message.error(t('backup.messages.createError'))
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = useCallback(() => {
    let filtered = [...backups]
    
    if (filters.type) {
      filtered = filtered.filter(backup => backup.type === filters.type)
    }
    if (filters.status) {
      filtered = filtered.filter(backup => backup.status === filters.status)
    }
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      filtered = filtered.filter(backup =>
        backup.name.toLowerCase().includes(searchLower) ||
        backup.description.toLowerCase().includes(searchLower) ||
        backup.createdBy.toLowerCase().includes(searchLower)
      )
    }
    if (filters.dateRange) {
      const [start, end] = filters.dateRange
      filtered = filtered.filter(backup =>
        backup.createdAt >= start && backup.createdAt <= end
      )
    }
    
    setFilteredBackups(filtered)
  }, [backups, filters])

  const handleCreateBackup = () => {
    setShowCreateModal(true)
  }

  const handleRestoreBackup = (backup: BackupItem) => {
    setSelectedBackup(backup)
    setShowRestoreModal(true)
  }

  const handleViewDetails = (backup: BackupItem) => {
    setSelectedBackup(backup)
    setShowDetailsDrawer(true)
  }

  const handleDownload = async (backup: BackupItem) => {
    try {
      setActionLoading(backup.id)
      const blob = await backupService.downloadBackup(backup.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${backup.name.replace(/\s+/g, '-').toLowerCase()}.sql`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success(t('backup.messages.createSuccess'))
    } catch (error) {
      message.error(t('backup.messages.downloadError'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (backup: BackupItem) => {
    try {
      setActionLoading(backup.id)
      await backupService.deleteBackup(backup.id)
      message.success(t('backup.messages.deleteSuccess'))
      fetchData()
    } catch (error) {
      message.error(t('backup.messages.deleteError'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleSearch = (value: string) => {
    setFilters({ ...filters, searchText: value })
  }

  const clearFilters = () => {
    setFilters({})
  }

  const getStatusTag = (status: BackupStatus) => {
    const statusConfig = {
      [BackupStatus.PENDING]: { color: 'default', icon: <ClockCircleOutlined /> },
      [BackupStatus.IN_PROGRESS]: { color: 'processing', icon: <LoadingOutlined spin /> },
      [BackupStatus.COMPLETED]: { color: 'success', icon: <CheckCircleOutlined /> },
      [BackupStatus.FAILED]: { color: 'error', icon: <ExclamationCircleOutlined /> },
      [BackupStatus.RESTORED]: { color: 'cyan', icon: <HistoryOutlined /> },
      [BackupStatus.EXPIRED]: { color: 'default', icon: <ClockCircleOutlined /> }
    }

    const config = statusConfig[status]
    return (
      <Tag color={config.color} icon={config.icon}>
        {t(`backup.status.${status.replace('_', '')}`)}
      </Tag>
    )
  }

  const getTypeIcon = (type: BackupType) => {
    const iconConfig = {
      [BackupType.FULL]: <DatabaseOutlined style={{ color: '#1890ff' }} />,
      [BackupType.INCREMENTAL]: <CloudDownloadOutlined style={{ color: '#52c41a' }} />,
      [BackupType.DIFFERENTIAL]: <ReloadOutlined style={{ color: '#faad14' }} />,
      [BackupType.CUSTOM]: <FilterOutlined style={{ color: '#722ed1' }} />
    }
    return iconConfig[type]
  }

  const columns: ColumnsType<BackupItem> = [
    {
      title: t('backup.table.name'),
      dataIndex: 'name',
      key: 'name',
      width: 250,
      fixed: 'left',
      render: (text: string, record: BackupItem) => (
        <Space>
          {getTypeIcon(record.type)}
          <div>
            <Text strong style={{ color: '#1890ff', cursor: 'pointer' }}
                  onClick={() => handleViewDetails(record)}>
              {text}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: t('backup.table.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      align: 'center',
      render: (type: BackupType) => (
        <Tag color="blue">{t(`backup.types.${type}`)}</Tag>
      )
    },
    {
      title: t('backup.table.size'),
      dataIndex: 'size',
      key: 'size',
      width: 100,
      align: 'center',
      render: (size: number) => (
        <Text strong>{backupService.formatFileSize(size)}</Text>
      )
    },
    {
      title: t('backup.table.created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
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
      title: t('backup.table.createdBy'),
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 150,
      render: (createdBy: string) => (
        <Text type="secondary">{createdBy}</Text>
      )
    },
    {
      title: t('backup.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status: BackupStatus) => getStatusTag(status)
    },
    {
      title: t('backup.table.actions'),
      key: 'actions',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_, record: BackupItem) => (
        <Space>
          <Tooltip title={t('backup.view')}>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title={t('backup.download')}>
            <Button
              type="link"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
              loading={actionLoading === record.id}
              disabled={record.status !== BackupStatus.COMPLETED}
              size="small"
            />
          </Tooltip>
          <Tooltip title={t('backup.restore')}>
            <Button
              type="link"
              icon={<HistoryOutlined />}
              onClick={() => handleRestoreBackup(record)}
              disabled={record.status !== BackupStatus.COMPLETED}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title={t('backup.messages.confirmDelete')}
            description={t('backup.messages.deleteWarning')}
            onConfirm={() => handleDelete(record)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Tooltip title={t('backup.delete')}>
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                loading={actionLoading === record.id}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="backup-page">
      {/* Header */}
      <Card className="page-header-card" variant="borderless">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              {t('backup.title')}
            </Title>
            <Text type="secondary">
              {t('backup.subtitle')}
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateBackup}
              >
                {t('backup.createNew')}
              </Button>
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
      </Card>

      {/* Stats Cards */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card variant="borderless">
              <Statistic
                title={t('backup.stats.total')}
                value={stats.totalBackups}
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card variant="borderless">
              <Statistic
                title={t('backup.stats.totalSize')}
                value={backupService.formatFileSize(stats.totalSize)}
                prefix={<FileProtectOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card variant="borderless">
              <Statistic
                title={t('backup.stats.successful')}
                value={stats.successfulBackups}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card variant="borderless">
              <Statistic
                title={t('backup.stats.failed')}
                value={stats.failedBackups}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginTop: 16 }} size="small">
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8}>
            <Search
              placeholder={t('backup.searchPlaceholder')}
              allowClear
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleSearch('')}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder={t('backup.form.type')}
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => setFilters({ ...filters, type: value })}
              value={filters.type}
            >
              <Option value={BackupType.FULL}>{t('backup.types.full')}</Option>
              <Option value={BackupType.INCREMENTAL}>{t('backup.types.incremental')}</Option>
              <Option value={BackupType.DIFFERENTIAL}>{t('backup.types.differential')}</Option>
              <Option value={BackupType.CUSTOM}>{t('backup.types.custom')}</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder={t('common.status')}
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => setFilters({ ...filters, status: value })}
              value={filters.status}
            >
              <Option value={BackupStatus.COMPLETED}>{t('backup.status.completed')}</Option>
              <Option value={BackupStatus.IN_PROGRESS}>{t('backup.status.in_progress')}</Option>
              <Option value={BackupStatus.FAILED}>{t('backup.status.failed')}</Option>
              <Option value={BackupStatus.PENDING}>{t('backup.status.pending')}</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates as [Date, Date] })}
              value={filters.dateRange}
            />
          </Col>
          <Col xs={24} sm={2}>
            <Button
              icon={<FilterOutlined />}
              onClick={clearFilters}
              disabled={!Object.keys(filters).some(key => filters[key as keyof BackupFilters])}
            >
              {t('analytics.filter.clearAll')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Backup Table */}
      <Card style={{ marginTop: 16 }} loading={loading}>
        {filteredBackups.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">{t('backup.noBackups')}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('backup.noBackupsDesc')}
                </Text>
              </div>
            }
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateBackup}>
              {t('backup.createNew')}
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredBackups}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `បង្ហាញ ${range[0]}-${range[1]} នៃ ${total} ការបេកអាប់`,
              pageSizeOptions: ['5', '10', '20', '50']
            }}
            scroll={{ x: 1200 }}
            loading={loading}
          />
        )}
      </Card>

      {/* Details Drawer */}
      <Drawer
        title={t('backup.backupDetails')}
        placement="right"
        width={600}
        open={showDetailsDrawer}
        onClose={() => setShowDetailsDrawer(false)}
      >
        {selectedBackup && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label={t('backup.table.name')}>
                <Space>
                  {getTypeIcon(selectedBackup.type)}
                  <Text strong>{selectedBackup.name}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t('backup.form.description')}>
                {selectedBackup.description}
              </Descriptions.Item>
              <Descriptions.Item label={t('backup.table.type')}>
                <Tag color="blue">{t(`backup.types.${selectedBackup.type}`)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('backup.table.status')}>
                {getStatusTag(selectedBackup.status)}
              </Descriptions.Item>
              <Descriptions.Item label={t('backup.table.size')}>
                {backupService.formatFileSize(selectedBackup.size)}
              </Descriptions.Item>
              <Descriptions.Item label={t('backup.table.created')}>
                {formatDate(selectedBackup.createdAt)} {selectedBackup.createdAt.toLocaleTimeString()}
              </Descriptions.Item>
              <Descriptions.Item label={t('backup.table.createdBy')}>
                {selectedBackup.createdBy}
              </Descriptions.Item>
            </Descriptions>

            {selectedBackup.metadata && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>ព័ត៌មានបន្ថែម</Title>
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="កំណែ">
                    {selectedBackup.metadata.version}
                  </Descriptions.Item>
                  <Descriptions.Item label="ចំនួនកំណត់ត្រា">
                    {selectedBackup.metadata.recordCount.toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="បង្ហាប់ទិន្នន័យ">
                    {selectedBackup.metadata.compression ? (
                      <Tag color="green" icon={<CompressOutlined />}>បាន</Tag>
                    ) : (
                      <Tag>មិនបាន</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="គ្រីបទិន្នន័យ">
                    {selectedBackup.metadata.encrypted ? (
                      <Tag color="gold" icon={<SecurityScanOutlined />}>បាន</Tag>
                    ) : (
                      <Tag>មិនបាន</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="តារាង" span={2}>
                    <Space wrap>
                      {selectedBackup.metadata.tables.map((table, index) => (
                        <Tag key={index}>{table}</Tag>
                      ))}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <Space>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(selectedBackup)}
                  loading={actionLoading === selectedBackup.id}
                  disabled={selectedBackup.status !== BackupStatus.COMPLETED}
                >
                  {t('backup.download')}
                </Button>
                <Button
                  icon={<HistoryOutlined />}
                  onClick={() => handleRestoreBackup(selectedBackup)}
                  disabled={selectedBackup.status !== BackupStatus.COMPLETED}
                >
                  {t('backup.restore')}
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Backup Modal */}
      <CreateBackupModal
        visible={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchData()
          message.success(t('backup.messages.createSuccess'))
        }}
      />

      {/* Restore Backup Modal */}
      <RestoreBackupModal
        visible={showRestoreModal}
        backup={selectedBackup}
        onCancel={() => {
          setShowRestoreModal(false)
          setSelectedBackup(null)
        }}
        onSuccess={() => {
          setShowRestoreModal(false)
          setSelectedBackup(null)
          fetchData()
          message.success(t('backup.messages.restoreSuccess'))
        }}
      />
    </div>
  )
}

export default BackupPage
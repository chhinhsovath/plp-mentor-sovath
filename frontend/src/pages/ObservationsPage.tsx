import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card,
  Table,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Tag,
  Dropdown,
  Modal,
  Form,
  Row,
  Col,
  App,
  Popconfirm,
  Tooltip,
  Badge,
} from 'antd';
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { observationService } from '../services/observation.service';
import { ObservationSession, ObservationForm } from '../types/observation';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

interface ObservationData {
  key: string;
  id: string;
  teacherName: string;
  schoolName: string;
  subject: string;
  grade: string;
  observationDate: Date;
  status: string;
  observerName: string;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
  actions?: any;
}

const ObservationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message } = App.useApp();
  
  // State management
  const [observations, setObservations] = useState<ObservationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState<ObservationData | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Load observations
  const loadObservations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await observationService.getObservations({
        page: pagination.current,
        limit: pagination.pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchText || undefined,
      });

      // Handle the response structure from the backend
      let observationsList: ObservationSession[] = [];
      let total = 0;

      if (Array.isArray(response)) {
        // Direct array response
        observationsList = response;
        total = response.length;
      } else if (response.data && Array.isArray(response.data)) {
        // Paginated response
        observationsList = response.data;
        total = response.total || response.data.length;
      } else if (response.items && Array.isArray(response.items)) {
        // Alternative paginated response
        observationsList = response.items;
        total = response.total || response.items.length;
      }

      // Transform to ObservationData format
      const transformedObservations: ObservationData[] = observationsList.map((obs: any) => ({
        key: obs.id,
        id: obs.id,
        teacherName: obs.teacherName || '',
        schoolName: obs.schoolName || '',
        subject: obs.subject || '',
        grade: obs.gradeLevel || obs.grade || '',
        observationDate: new Date(obs.observationDate),
        status: obs.status || 'draft',
        observerName: obs.observerName || obs.observer?.name || '',
        duration: obs.duration || (obs.endTime && obs.startTime ? 
          Math.round((new Date(`2000-01-01 ${obs.endTime}`).getTime() - new Date(`2000-01-01 ${obs.startTime}`).getTime()) / 60000) : 
          0),
        createdAt: new Date(obs.createdAt),
        updatedAt: new Date(obs.updatedAt),
      }));

      setObservations(transformedObservations);
      setPagination(prev => ({ ...prev, total }));
    } catch (error) {
      console.error('Error loading observations:', error);
      message.error(t('observations.loadError'));
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, statusFilter, searchText, t]);

  useEffect(() => {
    loadObservations();
  }, [loadObservations]);

  // Reload observations when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [searchText, statusFilter]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'processing';
      case 'draft': return 'default';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  // Action menu items
  const getActionItems = (record: ObservationData) => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: t('common.view'),
      onClick: () => navigate(`/observations/${record.id}`),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: t('common.edit'),
      onClick: () => navigate(`/observations/${record.id}/edit`),
    },
    {
      key: 'duplicate',
      icon: <CopyOutlined />,
      label: t('common.duplicate'),
      onClick: () => handleDuplicateObservation(record),
    },
    {
      key: 'download',
      icon: <DownloadOutlined />,
      label: t('common.download'),
      onClick: () => handleDownloadObservation(record),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: t('common.delete'),
      danger: true,
      onClick: () => handleDeleteObservation(record),
    },
  ];

  // Action handlers
  const handleDuplicateObservation = (observation: ObservationData) => {
    message.info(t('observations.duplicateComingSoon'));
  };

  const handleDownloadObservation = (observation: ObservationData) => {
    message.info(t('observations.downloadComingSoon'));
  };

  const handleDeleteObservation = (observation: ObservationData) => {
    Modal.confirm({
      title: t('observations.deleteConfirmTitle'),
      content: t('observations.deleteConfirmMessage'),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await observationService.deleteObservation(observation.id);
          message.success(t('observations.deleteSuccess'));
          loadObservations();
        } catch (error) {
          console.error('Delete error:', error);
          message.error(t('observations.deleteError'));
        }
      },
    });
  };

  // Table columns
  const columns: ColumnsType<ObservationData> = [
    {
      title: t('observations.teacher'),
      dataIndex: 'teacherName',
      key: 'teacherName',
      sorter: (a, b) => a.teacherName?.localeCompare(b.teacherName || '') || 0,
      render: (text: string, record: ObservationData) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.schoolName}</div>
        </div>
      ),
    },
    {
      title: t('observations.subject'),
      dataIndex: 'subject',
      key: 'subject',
      render: (text: string, record: ObservationData) => (
        <div>
          <Tag color="blue">{text}</Tag>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {t('observations.grade')} {record.grade}
          </div>
        </div>
      ),
    },
    {
      title: t('observations.observer'),
      dataIndex: 'observerName',
      key: 'observerName',
      sorter: (a, b) => a.observerName?.localeCompare(b.observerName || '') || 0,
    },
    {
      title: t('observations.date'),
      dataIndex: 'observationDate',
      key: 'observationDate',
      sorter: (a, b) => new Date(a.observationDate).getTime() - new Date(b.observationDate).getTime(),
      render: (date: Date) => format(date, 'dd/MM/yyyy'),
    },
    {
      title: t('observations.duration'),
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => t('observations.minutes', { count: duration }),
    },
    {
      title: t('observations.status'),
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: t('observations.statusDraft'), value: 'draft' },
        { text: t('observations.statusInProgress'), value: 'in_progress' },
        { text: t('observations.statusCompleted'), value: 'completed' },
        { text: t('observations.statusApproved'), value: 'approved' },
        { text: t('observations.statusRejected'), value: 'rejected' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {t(`observations.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      render: (_, record: ObservationData) => (
        <Space>
          <Tooltip title={t('common.view')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/observations/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title={t('common.edit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/observations/${record.id}/edit`)}
            />
          </Tooltip>
          <Dropdown
            menu={{ items: getActionItems(record) }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              {t('navigation.observations')}
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/observations/new')}
            >
              {t('observations.newObservation')}
            </Button>
          </Col>
        </Row>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder={t('observations.searchPlaceholder')}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder={t('observations.filterByStatus')}
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">{t('common.all')}</Option>
              <Option value="draft">{t('observations.statusDraft')}</Option>
              <Option value="in_progress">{t('observations.statusInProgress')}</Option>
              <Option value="completed">{t('observations.statusCompleted')}</Option>
              <Option value="approved">{t('observations.statusApproved')}</Option>
              <Option value="rejected">{t('observations.statusRejected')}</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={10}>
            <Space>
              <Badge count={pagination.total} showZero>
                <Button icon={<FilterOutlined />}>
                  {t('common.results')}
                </Button>
              </Badge>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={observations}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              t('observations.showTotal', { from: range[0], to: range[1], total }),
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || 10 }));
            },
          }}
          rowSelection={{
            type: 'checkbox',
            onChange: (selectedRowKeys, selectedRows) => {
              console.log('Selected rows:', selectedRows);
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default ObservationsPage;
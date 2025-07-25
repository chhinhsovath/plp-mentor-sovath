import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Table,
  Tag,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  App,
  Tooltip,
  Modal,
  Descriptions,
  Badge,
  Empty,
  Spin,
  Popconfirm,
  Form,
  Dropdown,
  Menu,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  FilterOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  MoreOutlined,
  SendOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import missionService from '../services/mission.service';
import MissionAdvancedFilters from '../components/MissionAdvancedFilters';
import MissionStats from '../components/MissionStats';
import {
  Mission,
  MissionType,
  MissionStatus,
  MissionFilter,
} from '../types/mission';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

export const MissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [statusUpdateModalVisible, setStatusUpdateModalVisible] = useState(false);
  const [filters, setFilters] = useState<MissionFilter>({});
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [statusUpdateForm] = Form.useForm();

  useEffect(() => {
    fetchMissions();
  }, [filters, pagination.current, pagination.pageSize]);

  const fetchMissions = async () => {
    setLoading(true);
    try {
      const response = await missionService.getMissions({
        ...filters,
        page: pagination.current,
        limit: pagination.pageSize,
      });
      setMissions(response.missions || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
      }));
    } catch (error) {
      console.error('Error fetching missions:', error);
      message.error('មិនអាចផ្ទុកបេសកកម្មបានទេ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await missionService.deleteMission(id);
      message.success('បានលុបបេសកកម្មដោយជោគជ័យ');
      fetchMissions();
    } catch (error) {
      console.error('Error deleting mission:', error);
      message.error('មិនអាចលុបបេសកកម្មបានទេ');
    }
  };

  const handleStatusUpdate = async (values: any) => {
    if (!selectedMission) return;
    
    try {
      const { status, approvalComments, rejectionReason } = values;
      await missionService.updateMissionStatus(selectedMission.id, {
        status,
        approvalComments,
        rejectionReason,
      });
      message.success('បានធ្វើបច្ចុប្បន្នភាពស្ថានភាពបេសកកម្មដោយជោគជ័យ');
      setStatusUpdateModalVisible(false);
      statusUpdateForm.resetFields();
      fetchMissions();
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('មិនអាចធ្វើបច្ចុប្បន្នភាពស្ថានភាពបេសកកម្មបានទេ');
    }
  };

  const showStatusUpdateModal = (mission: Mission) => {
    setSelectedMission(mission);
    statusUpdateForm.setFieldsValue({
      status: mission.status,
      approvalComments: mission.approvalComments || '',
      rejectionReason: mission.rejectionReason || '',
    });
    setStatusUpdateModalVisible(true);
  };

  const handleQuickStatusUpdate = async (id: string, status: MissionStatus) => {
    try {
      await missionService.updateMissionStatus(id, { status });
      message.success('បានធ្វើបច្ចុប្បន្នភាពស្ថានភាពបេសកកម្មដោយជោគជ័យ');
      fetchMissions();
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('មិនអាចធ្វើបច្ចុប្បន្នភាពស្ថានភាពបេសកកម្មបានទេ');
    }
  };

  const showMissionDetails = (mission: Mission) => {
    setSelectedMission(mission);
    setDetailModalVisible(true);
  };

  const getMissionTypeColor = (type: MissionType) => {
    switch (type) {
      case MissionType.FIELD_TRIP:
        return 'blue';
      case MissionType.TRAINING:
        return 'green';
      case MissionType.MEETING:
        return 'orange';
      case MissionType.MONITORING:
        return 'purple';
      default:
        return 'default';
    }
  };

  const getMissionStatusColor = (status: MissionStatus) => {
    switch (status) {
      case MissionStatus.DRAFT:
        return 'default';
      case MissionStatus.SUBMITTED:
        return 'processing';
      case MissionStatus.APPROVED:
        return 'success';
      case MissionStatus.REJECTED:
        return 'error';
      case MissionStatus.IN_PROGRESS:
        return 'processing';
      case MissionStatus.COMPLETED:
        return 'success';
      case MissionStatus.CANCELLED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getMissionStatusIcon = (status: MissionStatus) => {
    switch (status) {
      case MissionStatus.APPROVED:
      case MissionStatus.COMPLETED:
        return <CheckCircleOutlined />;
      case MissionStatus.REJECTED:
      case MissionStatus.CANCELLED:
        return <CloseCircleOutlined />;
      case MissionStatus.IN_PROGRESS:
      case MissionStatus.SUBMITTED:
        return <ClockCircleOutlined />;
      default:
        return <RocketOutlined />;
    }
  };

  const getMissionTypeInKhmer = (type: MissionType): string => {
    const typeMap: Record<MissionType, string> = {
      [MissionType.FIELD_TRIP]: 'ទស្សនកិច្ច',
      [MissionType.TRAINING]: 'វគ្គបណ្តុះបណ្តាល',
      [MissionType.MEETING]: 'កិច្ចប្រជុំ',
      [MissionType.MONITORING]: 'ការត្រួតពិនិត្យ',
      [MissionType.OTHER]: 'ផ្សេងៗ',
    };
    return typeMap[type] || type;
  };

  const getMissionStatusInKhmer = (status: MissionStatus): string => {
    const statusMap: Record<MissionStatus, string> = {
      [MissionStatus.DRAFT]: 'សេចក្តីព្រាង',
      [MissionStatus.SUBMITTED]: 'បានដាក់ស្នើ',
      [MissionStatus.APPROVED]: 'បានអនុម័ត',
      [MissionStatus.REJECTED]: 'បានបដិសេធ',
      [MissionStatus.IN_PROGRESS]: 'កំពុងដំណើរការ',
      [MissionStatus.COMPLETED]: 'បានបញ្ចប់',
      [MissionStatus.CANCELLED]: 'បានលុបចោល',
    };
    return statusMap[status] || status;
  };

  const formatKhmerDate = (date: string): string => {
    const khmerMonths = [
      'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
      'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
    ];
    const d = dayjs(date);
    const month = khmerMonths[d.month()];
    return `${d.date()} ${month} ${d.year()}`;
  };

  const columns: ColumnsType<Mission> = [
    {
      title: 'ចំណងជើង',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Mission) => (
        <Space>
          <Text strong>{text}</Text>
          {record.location && (
            <Tooltip title={record.location}>
              <EnvironmentOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'ប្រភេទ',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: MissionType) => (
        <Tag color={getMissionTypeColor(type)}>
          {getMissionTypeInKhmer(type)}
        </Tag>
      ),
    },
    {
      title: 'ស្ថានភាព',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: MissionStatus) => (
        <Badge
          status={getMissionStatusColor(status) as any}
          text={
            <Space>
              {getMissionStatusIcon(status)}
              {getMissionStatusInKhmer(status)}
            </Space>
          }
        />
      ),
    },
    {
      title: 'កាលបរិច្ឆេទចាប់ផ្តើម',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 150,
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          {formatKhmerDate(date)}
        </Space>
      ),
    },
    {
      title: 'កាលបរិច្ឆេទបញ្ចប់',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 150,
      render: (date: string) => formatKhmerDate(date),
    },
    {
      title: 'បង្កើតដោយ',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 150,
      render: (user: any) => user?.fullName || user?.username || 'មិនស្គាល់',
    },
    {
      title: 'អ្នកចូលរួម',
      dataIndex: 'missionParticipants',
      key: 'participants',
      width: 100,
      align: 'center',
      render: (participants: any[]) => (
        <Space>
          <TeamOutlined />
          <Text>{participants?.length || 0} នាក់</Text>
        </Space>
      ),
    },
    {
      title: 'សកម្មភាព',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_: any, record: Mission) => (
        <Space size="small">
          <Tooltip title="មើលព័ត៌មានលម្អិត">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showMissionDetails(record)}
            />
          </Tooltip>
          <Tooltip title="កែសម្រួល">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/missions/${record.id}/edit`)}
              disabled={record.status !== MissionStatus.DRAFT && record.status !== MissionStatus.REJECTED}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                ...(record.status === MissionStatus.DRAFT ? [{
                  key: "submit",
                  icon: <SendOutlined />,
                  label: "ដាក់ស្នើ",
                  onClick: () => handleQuickStatusUpdate(record.id, MissionStatus.SUBMITTED),
                }] : []),
                ...(record.status === MissionStatus.SUBMITTED ? [{
                  key: "approve",
                  icon: <CheckCircleOutlined />,
                  label: "អនុម័ត",
                  onClick: () => handleQuickStatusUpdate(record.id, MissionStatus.APPROVED),
                }, {
                  key: "reject",
                  icon: <CloseCircleOutlined />,
                  label: "បដិសេធ",
                  onClick: () => showStatusUpdateModal(record),
                }] : []),
                ...(record.status === MissionStatus.APPROVED ? [{
                  key: "start",
                  icon: <PlayCircleOutlined />,
                  label: "ចាប់ផ្តើម",
                  onClick: () => handleQuickStatusUpdate(record.id, MissionStatus.IN_PROGRESS),
                }] : []),
                ...(record.status === MissionStatus.IN_PROGRESS ? [{
                  key: "complete",
                  icon: <CheckCircleOutlined />,
                  label: "បញ្ចប់",
                  onClick: () => handleQuickStatusUpdate(record.id, MissionStatus.COMPLETED),
                }] : []),
                {
                  key: "updateStatus",
                  icon: <ReloadOutlined />,
                  label: "ធ្វើបច្ចុប្បន្នភាពស្ថានភាព",
                  onClick: () => showStatusUpdateModal(record),
                },
                ...(record.status === MissionStatus.DRAFT ? [{
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: "លុប",
                  danger: true,
                  onClick: () => {
                    Modal.confirm({
                      title: 'តើអ្នកប្រាកដថាចង់លុបបេសកកម្មនេះមែនទេ?',
                      onOk: () => handleDelete(record.id),
                      okText: 'បាទ/ចាស',
                      cancelText: 'ទេ',
                    });
                  },
                }] : []),
              ]
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters({ ...filters, search: value });
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              គ្រប់គ្រងបេសកកម្ម
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/missions/create')}
              size="large"
            >
              បង្កើតបេសកកម្មថ្មី
            </Button>
          </Col>
        </Row>
      </div>

      {/* Mission Statistics */}
      <MissionStats missions={missions} loading={loading} />

      {/* Advanced Filters */}
      <MissionAdvancedFilters
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          setPagination(prev => ({ ...prev, current: 1 }));
        }}
        onClearFilters={() => {
          setFilters({});
          setSearchText('');
          setPagination(prev => ({ ...prev, current: 1 }));
        }}
        loading={loading}
      />

      {/* Missions Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={missions}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `បង្ហាញ ${range[0]}-${range[1]} នៃ ${total} បេសកកម្ម`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize || 10,
              }));
            },
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="រកមិនឃើញបេសកកម្ម"
              >
                <Button type="primary" onClick={() => navigate('/missions/create')}>
                  បង្កើតបេសកកម្មដំបូង
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Mission Detail Modal */}
      <Modal
        title="ព័ត៌មានលម្អិតបេសកកម្ម"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            បិទ
          </Button>,
          selectedMission?.status === MissionStatus.DRAFT && (
            <Button
              key="edit"
              type="primary"
              onClick={() => {
                navigate(`/missions/${selectedMission.id}/edit`);
                setDetailModalVisible(false);
              }}
            >
              កែសម្រួលបេសកកម្ម
            </Button>
          ),
        ]}
        width={800}
      >
        {selectedMission && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="ចំណងជើង" span={2}>
              {selectedMission.title}
            </Descriptions.Item>
            <Descriptions.Item label="ប្រភេទ">
              <Tag color={getMissionTypeColor(selectedMission.type)}>
                {getMissionTypeInKhmer(selectedMission.type)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="ស្ថានភាព">
              <Badge
                status={getMissionStatusColor(selectedMission.status) as any}
                text={getMissionStatusInKhmer(selectedMission.status)}
              />
            </Descriptions.Item>
            <Descriptions.Item label="កាលបរិច្ឆេទចាប់ផ្តើម">
              {formatKhmerDate(selectedMission.startDate)}
            </Descriptions.Item>
            <Descriptions.Item label="កាលបរិច្ឆេទបញ្ចប់">
              {formatKhmerDate(selectedMission.endDate)}
            </Descriptions.Item>
            {selectedMission.location && (
              <Descriptions.Item label="ទីតាំង" span={2}>
                <Space>
                  <EnvironmentOutlined />
                  {selectedMission.location}
                  {selectedMission.latitude && selectedMission.longitude && (
                    <Text type="secondary">
                      ({Number(selectedMission.latitude).toFixed(6)}, {Number(selectedMission.longitude).toFixed(6)})
                    </Text>
                  )}
                </Space>
              </Descriptions.Item>
            )}
            {selectedMission.description && (
              <Descriptions.Item label="ការពិពណ៌នា" span={2}>
                {selectedMission.description}
              </Descriptions.Item>
            )}
            {selectedMission.purpose && (
              <Descriptions.Item label="គោលបំណង" span={2}>
                {selectedMission.purpose}
              </Descriptions.Item>
            )}
            {selectedMission.objectives && (
              <Descriptions.Item label="គោលដៅ" span={2}>
                {selectedMission.objectives}
              </Descriptions.Item>
            )}
            {selectedMission.expectedOutcomes && (
              <Descriptions.Item label="លទ្ធផលរំពឹងទុក" span={2}>
                {selectedMission.expectedOutcomes}
              </Descriptions.Item>
            )}
            {selectedMission.budget && (
              <Descriptions.Item label="ថវិកា">
                ៛ {selectedMission.budget.toLocaleString('km-KH')}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="បង្កើតដោយ">
              {selectedMission.createdBy?.fullName || selectedMission.createdBy?.username}
            </Descriptions.Item>
            <Descriptions.Item label="បង្កើតនៅ" span={2}>
              {formatKhmerDate(selectedMission.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal
        title="ធ្វើបច្ចុប្បន្នភាពស្ថានភាពបេសកកម្ម"
        open={statusUpdateModalVisible}
        onCancel={() => {
          setStatusUpdateModalVisible(false);
          statusUpdateForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={statusUpdateForm}
          layout="vertical"
          onFinish={handleStatusUpdate}
        >
          <Form.Item
            name="status"
            label="ស្ថានភាព"
            rules={[{ required: true, message: 'សូមជ្រើសរើសស្ថានភាព' }]}
          >
            <Select>
              <Option value={MissionStatus.DRAFT}>សេចក្តីព្រាង</Option>
              <Option value={MissionStatus.SUBMITTED}>បានដាក់ស្នើ</Option>
              <Option value={MissionStatus.APPROVED}>បានអនុម័ត</Option>
              <Option value={MissionStatus.REJECTED}>បានបដិសេធ</Option>
              <Option value={MissionStatus.IN_PROGRESS}>កំពុងដំណើរការ</Option>
              <Option value={MissionStatus.COMPLETED}>បានបញ្ចប់</Option>
              <Option value={MissionStatus.CANCELLED}>បានលុបចោល</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="approvalComments"
            label="មតិយោបល់អនុម័ត"
          >
            <TextArea
              rows={3}
              placeholder="បញ្ចូលមតិយោបល់អនុម័ត..."
            />
          </Form.Item>

          <Form.Item
            name="rejectionReason"
            label="មូលហេតុបដិសេធ"
          >
            <TextArea
              rows={3}
              placeholder="បញ្ចូលមូលហេតុបដិសេធ..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                ធ្វើបច្ចុប្បន្នភាពស្ថានភាព
              </Button>
              <Button onClick={() => {
                setStatusUpdateModalVisible(false);
                statusUpdateForm.resetFields();
              }}>
                បោះបង់
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
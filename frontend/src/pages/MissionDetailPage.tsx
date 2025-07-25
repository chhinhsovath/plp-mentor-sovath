import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Typography,
  Button,
  Space,
  Row,
  Col,
  Descriptions,
  Tag,
  Badge,
  Spin,
  message,
  Tabs,
  Timeline,
  List,
  Avatar,
  Empty,
  Tooltip,
  Modal,
  Form,
  Select,
  Input,
  App,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  DollarOutlined,
  UserAddOutlined,
  LoginOutlined,
  CarOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import missionService from '../services/mission.service';
import {
  Mission,
  MissionType,
  MissionStatus,
  MissionParticipant,
  MissionTracking,
  MissionReport,
  CreateMissionReportInput,
} from '../types/mission';
import { MissionReportForm } from '../components/MissionReportForm';
import { MissionReportView } from '../components/MissionReportView';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

export const MissionDetailPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [participantModalVisible, setParticipantModalVisible] = useState(false);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [missionReports, setMissionReports] = useState<MissionReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<MissionReport | null>(null);
  const [activeTab, setActiveTab] = useState<string>('details');
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchMission();
      fetchMissionReports();
    }
  }, [id]);

  useEffect(() => {
    // Check if we should navigate to a specific tab
    const state = location.state as any;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [location.state]);

  const fetchMission = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await missionService.getMissionById(id);
      setMission(data);
    } catch (error) {
      console.error('Error fetching mission:', error);
      message.error('Failed to load mission details');
      navigate('/missions');
    } finally {
      setLoading(false);
    }
  };

  const fetchMissionReports = async () => {
    if (!id) return;
    
    try {
      const reports = await missionService.getMissionReports(id);
      setMissionReports(reports);
    } catch (error) {
      console.error('Error fetching mission reports:', error);
    }
  };

  const handleSubmitReport = async (values: CreateMissionReportInput) => {
    if (!id) return;
    
    setReportSubmitting(true);
    try {
      await missionService.createMissionReport(values);
      messageApi.success('របាយការណ៍បេសកកម្មត្រូវបានដាក់ស្នើដោយជោគជ័យ');
      setReportModalVisible(false);
      fetchMissionReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      messageApi.error('មិនអាចដាក់ស្នើរបាយការណ៍បានទេ');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleAddParticipant = async (values: any) => {
    if (!id) return;
    
    try {
      await missionService.addParticipant(id, {
        userId: values.userId,
        role: values.role || 'participant',
      });
      message.success('Participant added successfully');
      setParticipantModalVisible(false);
      form.resetFields();
      fetchMission();
    } catch (error) {
      console.error('Error adding participant:', error);
      message.error('Failed to add participant');
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!id) return;
    
    Modal.confirm({
      title: 'Remove Participant',
      content: 'Are you sure you want to remove this participant?',
      onOk: async () => {
        try {
          await missionService.removeParticipant(id, participantId);
          message.success('Participant removed successfully');
          fetchMission();
        } catch (error) {
          console.error('Error removing participant:', error);
          message.error('Failed to remove participant');
        }
      },
    });
  };

  const handleCheckIn = async (participantId: string) => {
    if (!id) return;
    
    try {
      await missionService.checkInParticipant(id, participantId);
      message.success(t('missions.success.checkedIn') || 'ចុះឈ្មោះចូលរួមដោយជោគជ័យ');
      fetchMission();
    } catch (error) {
      console.error('Error checking in:', error);
      message.error(t('missions.error.checkInFailed') || 'មិនអាចចុះឈ្មោះចូលរួមបានទេ');
    }
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!mission) {
    return (
      <Empty
        description="រកមិនឃើញបេសកកម្ម"
        style={{ marginTop: '50px' }}
      >
        <Button onClick={() => navigate('/missions')}>ត្រឡប់ទៅបេសកកម្ម</Button>
      </Empty>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/missions')}
              >
                ត្រឡប់ទៅបេសកកម្ម
              </Button>
              <Title level={2} style={{ margin: 0 }}>
                {mission.title}
              </Title>
              <Tag color={getMissionTypeColor(mission.type)}>
                {getMissionTypeInKhmer(mission.type)}
              </Tag>
              <Badge
                status={getMissionStatusColor(mission.status) as any}
                text={
                  <Space>
                    {getMissionStatusIcon(mission.status)}
                    {getMissionStatusInKhmer(mission.status)}
                  </Space>
                }
              />
            </Space>
          </Col>
          <Col>
            {mission.status === MissionStatus.DRAFT && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/missions/${mission.id}/edit`)}
              >
                កែសម្រួលបេសកកម្ម
              </Button>
            )}
          </Col>
        </Row>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="ព័ត៌មានលម្អិត" key="details">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="ព័ត៌មានបេសកកម្ម">
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="ការពិពណ៌នា">
                    {mission.description || 'មិនមានការពិពណ៌នា'}
                  </Descriptions.Item>
                  <Descriptions.Item label="គោលបំណង">
                    {mission.purpose || 'មិនបានបញ្ជាក់'}
                  </Descriptions.Item>
                  <Descriptions.Item label="គោលដៅ">
                    {mission.objectives || 'មិនបានបញ្ជាក់'}
                  </Descriptions.Item>
                  <Descriptions.Item label="លទ្ធផលរំពឹងទុក">
                    {mission.expectedOutcomes || 'មិនបានបញ្ជាក់'}
                  </Descriptions.Item>
                  <Descriptions.Item label="កាលបរិច្ឆេទចាប់ផ្តើម">
                    <Space>
                      <CalendarOutlined />
                      {dayjs(mission.startDate).format('MMMM D, YYYY HH:mm')}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="កាលបរិច្ឆេទបញ្ចប់">
                    <Space>
                      <CalendarOutlined />
                      {dayjs(mission.endDate).format('MMMM D, YYYY HH:mm')}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="រយៈពេល">
                    {dayjs(mission.endDate).diff(dayjs(mission.startDate), 'days')} ថ្ងៃ
                  </Descriptions.Item>
                  {mission.budget && (
                    <Descriptions.Item label="ថវិកា">
                      <Space>
                        <DollarOutlined />
                        ៛{Number(mission.budget).toLocaleString('km-KH')}
                      </Space>
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="បង្កើតដោយ">
                    {mission.createdBy?.fullName || mission.createdBy?.username}
                  </Descriptions.Item>
                  <Descriptions.Item label="បង្កើតនៅ">
                    {dayjs(mission.createdAt).format('MMMM D, YYYY HH:mm')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="ព័ត៌មានអំពីភស្តុភារ" style={{ marginTop: 16 }}>
                <Descriptions bordered column={1}>
                  {mission.transportationDetails && (
                    <Descriptions.Item 
                      label={
                        <Space>
                          <CarOutlined />
                          មធ្យោបាយធ្វើដំណើរ
                        </Space>
                      }
                    >
                      {mission.transportationDetails}
                    </Descriptions.Item>
                  )}
                  {mission.accommodationDetails && (
                    <Descriptions.Item 
                      label={
                        <Space>
                          <HomeOutlined />
                          កន្លែងស្នាក់នៅ
                        </Space>
                      }
                    >
                      {mission.accommodationDetails}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              {mission.location && (
                <Card 
                  title={
                    <Space>
                      <EnvironmentOutlined />
                      ទីតាំង
                    </Space>
                  } 
                  style={{ marginBottom: 16 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>
                      {mission.location}
                    </Text>
                    {mission.latitude && mission.longitude && (
                      <>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          កូអរដោនេ: {Number(mission.latitude).toFixed(6)}, {Number(mission.longitude).toFixed(6)}
                        </Text>
                        <div style={{ height: 300, width: '100%', marginTop: 8, border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
                          <MapContainer
                            center={[mission.latitude, mission.longitude]}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[mission.latitude, mission.longitude]}>
                              <Popup>
                                <div>
                                  <Text strong>{mission.location}</Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {Number(mission.latitude).toFixed(6)}, {Number(mission.longitude).toFixed(6)}
                                  </Text>
                                </div>
                              </Popup>
                            </Marker>
                          </MapContainer>
                        </div>
                      </>
                    )}
                  </Space>
                </Card>
              )}

              {mission.approvalComments && (
                <Card title="មតិយោបល់អនុម័ត">
                  <Paragraph>{mission.approvalComments}</Paragraph>
                  {mission.approvedBy && (
                    <Text type="secondary">
                      អនុម័តដោយ: {mission.approvedBy.fullName || mission.approvedBy.username}
                    </Text>
                  )}
                </Card>
              )}

              {mission.rejectionReason && (
                <Card title="មូលហេតុបដិសេធ">
                  <Paragraph type="danger">{mission.rejectionReason}</Paragraph>
                </Card>
              )}
            </Col>
          </Row>
        </TabPane>

        <TabPane 
          tab={
            <Space>
              <TeamOutlined />
              អ្នកចូលរួម ({mission.missionParticipants?.length || 0})
            </Space>
          } 
          key="participants"
        >
          <Card
            title="អ្នកចូលរួមបេសកកម្ម"
            extra={
              mission.status === MissionStatus.APPROVED && (
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => setParticipantModalVisible(true)}
                >
                  បន្ថែមអ្នកចូលរួម
                </Button>
              )
            }
          >
            {mission.missionParticipants && mission.missionParticipants.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={mission.missionParticipants}
                renderItem={(participant: MissionParticipant) => (
                  <List.Item
                    actions={[
                      participant.hasCheckedIn ? (
                        <Tag color="success">
                          <CheckCircleOutlined /> បានចុះឈ្មោះចូលរួម
                        </Tag>
                      ) : (
                        <Button
                          size="small"
                          icon={<LoginOutlined />}
                          onClick={() => handleCheckIn(participant.id)}
                          disabled={mission.status !== MissionStatus.IN_PROGRESS}
                        >
                          ចុះឈ្មោះចូលរួម
                        </Button>
                      ),
                      <Button
                        type="text"
                        danger
                        size="small"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        disabled={mission.status !== MissionStatus.APPROVED}
                      >
                        ដកចេញ
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar>{participant.user.fullName?.[0] || participant.user.username[0]}</Avatar>}
                      title={
                        <Space>
                          {participant.user.fullName || participant.user.username}
                          {participant.isLeader && <Tag color="gold">ប្រធានក្រុម</Tag>}
                          <Tag>{participant.role}</Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size="small">
                          <Text type="secondary">{participant.user.email}</Text>
                          {participant.hasConfirmed && (
                            <Text type="success">
                              បានបញ្ជាក់នៅ {dayjs(participant.confirmedAt).format('MMM D, YYYY')}
                            </Text>
                          )}
                          {participant.hasCheckedIn && (
                            <Text type="success">
                              បានចុះឈ្មោះចូលរួមនៅ {dayjs(participant.checkedInAt).format('MMM D, YYYY HH:mm')}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="មិនទាន់មានអ្នកចូលរួម" />
            )}
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <Space>
              <FileTextOutlined />
              របាយការណ៍ ({missionReports.length})
            </Space>
          } 
          key="reports"
        >
          <Card
            title="របាយការណ៍បេសកកម្ម"
            extra={
              mission && (
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={() => setReportModalVisible(true)}
                >
                  បង្កើតរបាយការណ៍ថ្មី
                </Button>
              )
            }
          >
            {missionReports.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={missionReports}
                renderItem={(report: MissionReport) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        onClick={() => setSelectedReport(report)}
                      >
                        មើលលម្អិត
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar icon={<FileTextOutlined />} />
                      }
                      title={
                        <Space>
                          <Text>របាយការណ៍បេសកកម្ម</Text>
                          <Tag color={
                            report.status === 'approved' ? 'green' :
                            report.status === 'rejected' ? 'red' :
                            report.status === 'submitted' ? 'blue' :
                            'default'
                          }>
                            {report.status === 'draft' && 'សេចក្តីព្រាង'}
                            {report.status === 'submitted' && 'បានដាក់ស្នើ'}
                            {report.status === 'approved' && 'បានអនុម័ត'}
                            {report.status === 'rejected' && 'បានបដិសេធ'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size="small">
                          <Text type="secondary">
                            ដាក់ស្នើដោយ: {report.submittedBy.fullName || report.submittedBy.username}
                          </Text>
                          <Text type="secondary">
                            កាលបរិច្ឆេទ: {dayjs(report.submittedAt).format('DD/MM/YYYY HH:mm')}
                          </Text>
                          <Text ellipsis style={{ maxWidth: 400 }}>
                            {report.summary}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty 
                description="មិនមានរបាយការណ៍" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                {mission && (
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    onClick={() => setReportModalVisible(true)}
                  >
                    បង្កើតរបាយការណ៍ដំបូង
                  </Button>
                )}
              </Empty>
            )}
          </Card>
        </TabPane>

        <TabPane tab="ការតាមដាន" key="tracking">
          <Card title="ការតាមដានបេសកកម្ម">
            {mission.trackingData && mission.trackingData.length > 0 ? (
              <Timeline>
                {mission.trackingData.map((tracking: MissionTracking) => (
                  <Timeline.Item
                    key={tracking.id}
                    dot={<EnvironmentOutlined style={{ fontSize: '16px' }} />}
                  >
                    <Space direction="vertical">
                      <Text strong>{tracking.activity}</Text>
                      <Text>{tracking.notes}</Text>
                      <Space>
                        <Text type="secondary">
                          {dayjs(tracking.recordedAt).format('MMM D, YYYY HH:mm')}
                        </Text>
                        <Text type="secondary">ដោយ {tracking.user.fullName || tracking.user.username}</Text>
                      </Space>
                      {tracking.latitude && tracking.longitude && (
                        <Text type="secondary">
                          ទីតាំង: {Number(tracking.latitude).toFixed(6)}, {Number(tracking.longitude).toFixed(6)}
                        </Text>
                      )}
                    </Space>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="No tracking data available" />
            )}
          </Card>
        </TabPane>
      </Tabs>

      {/* Add Participant Modal */}
      <Modal
        title="Add Participant"
        visible={participantModalVisible}
        onCancel={() => {
          setParticipantModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddParticipant}
        >
          <Form.Item
            name="userId"
            label="Select User"
            rules={[{ required: true, message: 'Please select a user' }]}
          >
            <Select placeholder="Select a user">
              {/* This would be populated with available users */}
              <Option value="user1">John Smith</Option>
              <Option value="user2">Sarah Johnson</Option>
              <Option value="user3">Mike Chen</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            initialValue="participant"
          >
            <Select>
              <Option value="participant">Participant</Option>
              <Option value="observer">Observer</Option>
              <Option value="coordinator">Coordinator</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Add Participant
              </Button>
              <Button onClick={() => {
                setParticipantModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Mission Report Modal */}
      <Modal
        title="បង្កើតរបាយការណ៍បេសកកម្ម"
        visible={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={null}
        width={1000}
        destroyOnClose
      >
        {mission && (
          <MissionReportForm
            mission={mission}
            onSubmit={handleSubmitReport}
            onCancel={() => setReportModalVisible(false)}
            loading={reportSubmitting}
          />
        )}
      </Modal>

      {/* Report View Modal */}
      <Modal
        title="លម្អិតរបាយការណ៍បេសកកម្ម"
        visible={!!selectedReport}
        onCancel={() => setSelectedReport(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedReport(null)}>
            បិទ
          </Button>,
        ]}
        width={1000}
      >
        {selectedReport && <MissionReportView report={selectedReport} />}
      </Modal>
    </div>
  );
};
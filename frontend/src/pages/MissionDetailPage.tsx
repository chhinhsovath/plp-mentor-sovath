import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '../types/mission';

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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [participantModalVisible, setParticipantModalVisible] = useState(false);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchMission();
    }
  }, [id]);

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
        description="Mission not found"
        style={{ marginTop: '50px' }}
      >
        <Button onClick={() => navigate('/missions')}>Back to Missions</Button>
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
                Back to Missions
              </Button>
              <Title level={2} style={{ margin: 0 }}>
                {mission.title}
              </Title>
              <Tag color={getMissionTypeColor(mission.type)}>
                {mission.type.replace('_', ' ').toUpperCase()}
              </Tag>
              <Badge
                status={getMissionStatusColor(mission.status) as any}
                text={
                  <Space>
                    {getMissionStatusIcon(mission.status)}
                    {mission.status.replace('_', ' ').toUpperCase()}
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
                Edit Mission
              </Button>
            )}
          </Col>
        </Row>
      </div>

      <Tabs defaultActiveKey="details">
        <TabPane tab="Details" key="details">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="Mission Information">
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Description">
                    {mission.description || 'No description provided'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Purpose">
                    {mission.purpose || 'Not specified'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Objectives">
                    {mission.objectives || 'Not specified'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Expected Outcomes">
                    {mission.expectedOutcomes || 'Not specified'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Start Date">
                    <Space>
                      <CalendarOutlined />
                      {dayjs(mission.startDate).format('MMMM D, YYYY HH:mm')}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="End Date">
                    <Space>
                      <CalendarOutlined />
                      {dayjs(mission.endDate).format('MMMM D, YYYY HH:mm')}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Duration">
                    {dayjs(mission.endDate).diff(dayjs(mission.startDate), 'days')} days
                  </Descriptions.Item>
                  {mission.budget && (
                    <Descriptions.Item label="Budget">
                      <Space>
                        <DollarOutlined />
                        ${mission.budget.toFixed(2)}
                      </Space>
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Created By">
                    {mission.createdBy?.fullName || mission.createdBy?.username}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created At">
                    {dayjs(mission.createdAt).format('MMMM D, YYYY HH:mm')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="Logistics" style={{ marginTop: 16 }}>
                <Descriptions bordered column={1}>
                  {mission.transportationDetails && (
                    <Descriptions.Item 
                      label={
                        <Space>
                          <CarOutlined />
                          Transportation
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
                          Accommodation
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
                      {t('missions.details.location') || 'ទីតាំង'}
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
                          {t('missions.details.coordinates') || 'កូអរដោនេ'}: {mission.latitude.toFixed(6)}, {mission.longitude.toFixed(6)}
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
                                    {mission.latitude.toFixed(6)}, {mission.longitude.toFixed(6)}
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
                <Card title="Approval Comments">
                  <Paragraph>{mission.approvalComments}</Paragraph>
                  {mission.approvedBy && (
                    <Text type="secondary">
                      Approved by: {mission.approvedBy.fullName || mission.approvedBy.username}
                    </Text>
                  )}
                </Card>
              )}

              {mission.rejectionReason && (
                <Card title="Rejection Reason">
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
              Participants ({mission.missionParticipants?.length || 0})
            </Space>
          } 
          key="participants"
        >
          <Card
            title="Mission Participants"
            extra={
              mission.status === MissionStatus.APPROVED && (
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => setParticipantModalVisible(true)}
                >
                  Add Participant
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
                          <CheckCircleOutlined /> Checked In
                        </Tag>
                      ) : (
                        <Button
                          size="small"
                          icon={<LoginOutlined />}
                          onClick={() => handleCheckIn(participant.id)}
                          disabled={mission.status !== MissionStatus.IN_PROGRESS}
                        >
                          Check In
                        </Button>
                      ),
                      <Button
                        type="text"
                        danger
                        size="small"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        disabled={mission.status !== MissionStatus.APPROVED}
                      >
                        Remove
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar>{participant.user.fullName?.[0] || participant.user.username[0]}</Avatar>}
                      title={
                        <Space>
                          {participant.user.fullName || participant.user.username}
                          {participant.isLeader && <Tag color="gold">Leader</Tag>}
                          <Tag>{participant.role}</Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size="small">
                          <Text type="secondary">{participant.user.email}</Text>
                          {participant.hasConfirmed && (
                            <Text type="success">
                              Confirmed on {dayjs(participant.confirmedAt).format('MMM D, YYYY')}
                            </Text>
                          )}
                          {participant.hasCheckedIn && (
                            <Text type="success">
                              Checked in on {dayjs(participant.checkedInAt).format('MMM D, YYYY HH:mm')}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No participants yet" />
            )}
          </Card>
        </TabPane>

        <TabPane tab="Tracking" key="tracking">
          <Card title="Mission Tracking">
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
                        <Text type="secondary">by {tracking.user.fullName || tracking.user.username}</Text>
                      </Space>
                      {tracking.latitude && tracking.longitude && (
                        <Text type="secondary">
                          Location: {tracking.latitude.toFixed(6)}, {tracking.longitude.toFixed(6)}
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
    </div>
  );
};
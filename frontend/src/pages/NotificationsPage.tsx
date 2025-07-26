import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  List,
  Button,
  Space,
  Tag,
  Tabs,
  Empty,
  Spin,
  Badge,
  Avatar,
  Dropdown,
  Menu,
  Row,
  Col,
  DatePicker,
  Select,
  Checkbox,
  message,
  Pagination,
  Divider,
  Statistic,
} from 'antd';
import {
  BellOutlined,
  FilterOutlined,
  CheckOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  AlertOutlined,
  SoundOutlined,
  DownloadOutlined,
  ReloadOutlined,
  MailOutlined,
  MessageOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import { formatDistanceToNow, format } from 'date-fns';
import { km } from 'date-fns/locale';
import { notificationService, Notification, NotificationType, NotificationStats } from '../services/notification.service';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    types: [] as NotificationType[],
    priority: [] as string[],
    dateRange: null as [Date, Date] | null,
  });

  useEffect(() => {
    loadNotifications();
    loadStats();
  }, [page, selectedTab, filters]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 20,
      };

      if (selectedTab === 'unread') params.unreadOnly = true;
      if (filters.types.length > 0) params.type = filters.types;
      if (filters.priority.length > 0) params.priority = filters.priority;
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].toISOString();
        params.endDate = filters.dateRange[1].toISOString();
      }

      const data = await notificationService.getNotifications(params);
      setNotifications(data.notifications);
      setTotal(data.total);
    } catch (error) {
      message.error('មិនអាចផ្ទុកការជូនដំណឹងបានទេ');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await notificationService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      loadNotifications();
      loadStats();
    } catch (error) {
      message.error('មិនអាចកំណត់ថាបានអានបានទេ');
    }
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedNotifications.length === 0) return;
    try {
      await notificationService.markMultipleAsRead(selectedNotifications);
      setSelectedNotifications([]);
      loadNotifications();
      loadStats();
      message.success('បានកំណត់ថាបានអាន');
    } catch (error) {
      message.error('មិនអាចកំណត់ថាបានអានបានទេ');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      loadNotifications();
      loadStats();
      message.success('បានកំណត់ទាំងអស់ថាបានអាន');
    } catch (error) {
      message.error('មិនអាចកំណត់ថាបានអានបានទេ');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      loadNotifications();
      loadStats();
      message.success('បានលុបការជូនដំណឹង');
    } catch (error) {
      message.error('មិនអាចលុបការជូនដំណឹងបានទេ');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.length === 0) return;
    try {
      await Promise.all(
        selectedNotifications.map(id => notificationService.deleteNotification(id))
      );
      setSelectedNotifications([]);
      loadNotifications();
      loadStats();
      message.success('បានលុបការជូនដំណឹងដែលបានជ្រើស');
    } catch (error) {
      message.error('មិនអាចលុបការជូនដំណឹងបានទេ');
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    const iconProps = {
      style: { fontSize: 20 },
    };

    switch (notification.category) {
      case 'mission':
        return <CalendarOutlined {...iconProps} style={{ ...iconProps.style, color: '#1890ff' }} />;
      case 'observation':
        return <FileTextOutlined {...iconProps} style={{ ...iconProps.style, color: '#52c41a' }} />;
      case 'approval':
        return <CheckOutlined {...iconProps} style={{ ...iconProps.style, color: '#faad14' }} />;
      case 'system':
        return <AlertOutlined {...iconProps} style={{ ...iconProps.style, color: '#ff4d4f' }} />;
      case 'user':
        return <UserOutlined {...iconProps} style={{ ...iconProps.style, color: '#722ed1' }} />;
      case 'announcement':
        return <SoundOutlined {...iconProps} style={{ ...iconProps.style, color: '#fa541c' }} />;
      default:
        return <BellOutlined {...iconProps} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'blue';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const renderNotificationItem = (notification: Notification) => (
    <List.Item
      style={{
        backgroundColor: !notification.read ? '#e6f7ff' : undefined,
        padding: '16px 24px',
        cursor: 'pointer',
      }}
      onClick={() => {
        if (!notification.read) {
          handleMarkAsRead(notification.id);
        }
      }}
      actions={[
        <Dropdown
          overlay={
            <Menu>
              {!notification.read && (
                <Menu.Item
                  key="read"
                  icon={<CheckOutlined />}
                  onClick={(e) => {
                    e.domEvent.stopPropagation();
                    handleMarkAsRead(notification.id);
                  }}
                >
                  កំណត់ថាបានអាន
                </Menu.Item>
              )}
              <Menu.Item
                key="delete"
                icon={<DeleteOutlined />}
                danger
                onClick={(e) => {
                  e.domEvent.stopPropagation();
                  handleDelete(notification.id);
                }}
              >
                លុប
              </Menu.Item>
            </Menu>
          }
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<EllipsisOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>,
      ]}
    >
      <Checkbox
        checked={selectedNotifications.includes(notification.id)}
        onChange={(e) => {
          e.stopPropagation();
          if (e.target.checked) {
            setSelectedNotifications([...selectedNotifications, notification.id]);
          } else {
            setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id));
          }
        }}
        onClick={(e) => e.stopPropagation()}
        style={{ marginRight: 16 }}
      />
      
      <List.Item.Meta
        avatar={
          <Badge dot={!notification.read} offset={[-5, 5]}>
            <Avatar icon={getNotificationIcon(notification)} size={40} />
          </Badge>
        }
        title={
          <Space>
            <Text strong={!notification.read}>{notification.title}</Text>
            {notification.priority !== 'medium' && (
              <Tag color={getPriorityColor(notification.priority)} style={{ fontSize: 11 }}>
                {notification.priority === 'urgent' ? 'បន្ទាន់' :
                 notification.priority === 'high' ? 'សំខាន់' :
                 notification.priority === 'low' ? 'ទាប' : ''}
              </Tag>
            )}
          </Space>
        }
        description={
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">{notification.message}</Text>
            <Space size="small">
              <ClockCircleOutlined style={{ fontSize: 12 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: km,
                })}
              </Text>
              {notification.readAt && (
                <>
                  <Divider type="vertical" />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    អាននៅ {format(new Date(notification.readAt), 'PPp', { locale: km })}
                  </Text>
                </>
              )}
            </Space>
          </Space>
        }
      />
    </List.Item>
  );

  return (
    <div>
      <Card>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Title level={2}>
              <BellOutlined /> ការជូនដំណឹង
            </Title>
          </Col>
          
          {stats && (
            <>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="ការជូនដំណឹងសរុប"
                    value={stats.total}
                    prefix={<BellOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="មិនទាន់អាន"
                    value={stats.unread}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<Badge dot />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="បន្ទាន់/សំខាន់"
                    value={
                      (stats.byPriority['urgent'] || 0) + 
                      (stats.byPriority['high'] || 0)
                    }
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<ExclamationCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="សកម្មភាពថ្មីៗ"
                    value={stats.byType['mission_created'] || 0}
                    prefix={<CalendarOutlined />}
                  />
                </Card>
              </Col>
            </>
          )}
        </Row>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row justify="space-between" align="middle">
            <Col>
              <Tabs
                activeKey={selectedTab}
                onChange={(key) => {
                  setSelectedTab(key);
                  setPage(1);
                }}
              >
                <TabPane tab="ទាំងអស់" key="all" />
                <TabPane 
                  tab={
                    <Badge count={stats?.unread || 0} offset={[10, 0]}>
                      <span>មិនទាន់អាន</span>
                    </Badge>
                  } 
                  key="unread" 
                />
              </Tabs>
            </Col>
            <Col>
              <Space>
                {selectedNotifications.length > 0 && (
                  <>
                    <Button onClick={handleMarkSelectedAsRead}>
                      កំណត់ថាបានអាន ({selectedNotifications.length})
                    </Button>
                    <Button danger onClick={handleDeleteSelected}>
                      លុប ({selectedNotifications.length})
                    </Button>
                  </>
                )}
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item onClick={handleMarkAllAsRead}>
                        កំណត់ទាំងអស់ថាបានអាន
                      </Menu.Item>
                      <Menu.Item onClick={loadNotifications}>
                        <ReloadOutlined /> ផ្ទុកឡើងវិញ
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <Button icon={<EllipsisOutlined />} />
                </Dropdown>
              </Space>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Select
                mode="multiple"
                placeholder="ប្រភេទការជូនដំណឹង"
                style={{ width: '100%' }}
                value={filters.types}
                onChange={(values) => setFilters({ ...filters, types: values })}
              >
                <Option value="mission_created">បេសកកម្មថ្មី</Option>
                <Option value="observation_created">ការសង្កេតថ្មី</Option>
                <Option value="approval_required">ត្រូវការអនុម័ត</Option>
                <Option value="announcement">សេចក្តីប្រកាស</Option>
                <Option value="system_alert">ប្រព័ន្ធ</Option>
              </Select>
            </Col>
            <Col xs={24} md={8}>
              <Select
                mode="multiple"
                placeholder="អាទិភាព"
                style={{ width: '100%' }}
                value={filters.priority}
                onChange={(values) => setFilters({ ...filters, priority: values })}
              >
                <Option value="urgent">បន្ទាន់</Option>
                <Option value="high">ខ្ពស់</Option>
                <Option value="medium">មធ្យម</Option>
                <Option value="low">ទាប</Option>
              </Select>
            </Col>
            <Col xs={24} md={8}>
              <RangePicker
                style={{ width: '100%' }}
                value={filters.dateRange as any}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates as any })}
                placeholder={['កាលបរិច្ឆេទចាប់ផ្តើម', 'កាលបរិច្ឆេទបញ្ចប់']}
              />
            </Col>
          </Row>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : notifications.length === 0 ? (
            <Empty
              description={selectedTab === 'unread' ? 'គ្មានការជូនដំណឹងមិនទាន់អាន' : 'គ្មានការជូនដំណឹង'}
            />
          ) : (
            <>
              <List
                dataSource={notifications}
                renderItem={renderNotificationItem}
                locale={{ emptyText: 'គ្មានការជូនដំណឹង' }}
              />
              
              <Pagination
                current={page}
                total={total}
                pageSize={20}
                onChange={setPage}
                showTotal={(total) => `សរុប ${total} ការជូនដំណឹង`}
                style={{ marginTop: 16, textAlign: 'center' }}
              />
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default NotificationsPage;
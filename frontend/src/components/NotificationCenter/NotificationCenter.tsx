import React, { useState, useEffect } from 'react';
import {
  Badge,
  Button,
  Dropdown,
  List,
  Avatar,
  Space,
  Typography,
  Tabs,
  Empty,
  Spin,
  Menu,
  Tag,
  Tooltip,
  message,
  Divider,
  Card,
  Row,
  Col,
  Checkbox,
} from 'antd';
import {
  BellOutlined,
  BellFilled,
  CheckOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  FilterOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  AlertOutlined,
  SoundOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { km } from 'date-fns/locale';
import { notificationService, Notification, NotificationType } from '../../services/notification.service';
import { useAuth } from '../../contexts/AuthContext';
import './NotificationCenter.css';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [filterMenu, setFilterMenu] = useState(false);
  const [filters, setFilters] = useState({
    types: [] as NotificationType[],
    priority: [] as string[],
  });

  // Initialize notification service and load notifications
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('access_token');
      if (token) {
        notificationService.initializeSocket(token);
        loadNotifications();
        requestNotificationPermission();
      }
    }

    // Listen for real-time notifications
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail as Notification;
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      message.info(`ការជូនដំណឹងថ្មី: ${notification.title}`);
    };

    const handleNotificationRead = (event: CustomEvent) => {
      const { id } = event.detail;
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleNotificationsRead = (event: CustomEvent) => {
      const { ids } = event.detail;
      setNotifications(prev =>
        prev.map(n => (ids.includes(n.id) ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - ids.length));
    };

    const handleAllNotificationsRead = () => {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    };

    const handleNotificationDeleted = (event: CustomEvent) => {
      const { id } = event.detail;
      setNotifications(prev => prev.filter(n => n.id !== id));
    };

    window.addEventListener('new-notification', handleNewNotification as EventListener);
    window.addEventListener('notification-read', handleNotificationRead as EventListener);
    window.addEventListener('notifications-read', handleNotificationsRead as EventListener);
    window.addEventListener('all-notifications-read', handleAllNotificationsRead);
    window.addEventListener('notification-deleted', handleNotificationDeleted as EventListener);

    return () => {
      window.removeEventListener('new-notification', handleNewNotification as EventListener);
      window.removeEventListener('notification-read', handleNotificationRead as EventListener);
      window.removeEventListener('notifications-read', handleNotificationsRead as EventListener);
      window.removeEventListener('all-notifications-read', handleAllNotificationsRead);
      window.removeEventListener('notification-deleted', handleNotificationDeleted as EventListener);
      notificationService.disconnect();
    };
  }, [user]);

  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      console.log('Notification permission granted');
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedTab === 'unread') params.unreadOnly = true;
      if (filters.types.length > 0) params.type = filters.types;
      if (filters.priority.length > 0) params.priority = filters.priority;

      const data = await notificationService.getNotifications(params);
      setNotifications(data.notifications);
      setUnreadCount(data.unread);
    } catch (error) {
      message.error('មិនអាចផ្ទុកការជូនដំណឹងបានទេ');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      message.error('មិនអាចកំណត់ថាបានអានបានទេ');
    }
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedNotifications.length === 0) return;
    try {
      await notificationService.markMultipleAsRead(selectedNotifications);
      setSelectedNotifications([]);
      message.success('បានកំណត់ថាបានអាន');
    } catch (error) {
      message.error('មិនអាចកំណត់ថាបានអានបានទេ');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      message.success('បានកំណត់ទាំងអស់ថាបានអាន');
    } catch (error) {
      message.error('មិនអាចកំណត់ថាបានអានបានទេ');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      message.success('បានលុបការជូនដំណឹង');
    } catch (error) {
      message.error('មិនអាចលុបការជូនដំណឹងបានទេ');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    if (notification.actions?.[0]?.url) {
      navigate(notification.actions[0].url);
      setVisible(false);
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
        return <CheckCircleOutlined {...iconProps} style={{ ...iconProps.style, color: '#faad14' }} />;
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
      className={`notification-item ${!notification.read ? 'unread' : ''}`}
      onClick={() => handleNotificationClick(notification)}
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
      <List.Item.Meta
        avatar={
          <Badge dot={!notification.read} offset={[-5, 5]}>
            <Avatar icon={getNotificationIcon(notification)} />
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
            <Text type="secondary" style={{ fontSize: 13 }}>
              {notification.message}
            </Text>
            <Space size="small">
              <ClockCircleOutlined style={{ fontSize: 12 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: km,
                })}
              </Text>
            </Space>
            {notification.actions && notification.actions.length > 0 && (
              <Space style={{ marginTop: 8 }}>
                {notification.actions.map((action, index) => (
                  <Button
                    key={index}
                    type={action.primary ? 'primary' : 'default'}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (action.url) {
                        navigate(action.url);
                        setVisible(false);
                      }
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </Space>
            )}
          </Space>
        }
      />
      {selectedNotifications.length > 0 && (
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
        />
      )}
    </List.Item>
  );

  const notificationMenu = (
    <div className="notification-dropdown" style={{ width: 420 }}>
      <div className="notification-header">
        <Title level={4} style={{ margin: 0 }}>ការជូនដំណឹង</Title>
        <Space>
          <Tooltip title="ការកំណត់">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => {
                navigate('/settings');
                setVisible(false);
              }}
            />
          </Tooltip>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item onClick={handleMarkAllAsRead}>
                  កំណត់ទាំងអស់ថាបានអាន
                </Menu.Item>
                {selectedNotifications.length > 0 && (
                  <Menu.Item onClick={handleMarkSelectedAsRead}>
                    កំណត់ដែលបានជ្រើសថាបានអាន ({selectedNotifications.length})
                  </Menu.Item>
                )}
              </Menu>
            }
          >
            <Button type="text" icon={<EllipsisOutlined />} />
          </Dropdown>
        </Space>
      </div>

      <Tabs
        activeKey={selectedTab}
        onChange={(key) => {
          setSelectedTab(key);
          loadNotifications();
        }}
        tabBarExtraContent={
          <Dropdown
            visible={filterMenu}
            onVisibleChange={setFilterMenu}
            overlay={
              <Card style={{ width: 300 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>ប្រភេទ</Text>
                    <Checkbox.Group
                      options={[
                        { label: 'បេសកកម្ម', value: 'mission' },
                        { label: 'ការសង្កេត', value: 'observation' },
                        { label: 'ការអនុម័ត', value: 'approval' },
                        { label: 'ប្រព័ន្ធ', value: 'system' },
                        { label: 'អ្នកប្រើ', value: 'user' },
                        { label: 'សេចក្តីប្រកាស', value: 'announcement' },
                      ]}
                      value={filters.types as any}
                      onChange={(values) => setFilters({ ...filters, types: values as any })}
                    />
                  </div>
                  <div>
                    <Text strong>អាទិភាព</Text>
                    <Checkbox.Group
                      options={[
                        { label: 'បន្ទាន់', value: 'urgent' },
                        { label: 'ខ្ពស់', value: 'high' },
                        { label: 'មធ្យម', value: 'medium' },
                        { label: 'ទាប', value: 'low' },
                      ]}
                      value={filters.priority}
                      onChange={(values) => setFilters({ ...filters, priority: values })}
                    />
                  </div>
                  <Button
                    type="primary"
                    block
                    onClick={() => {
                      loadNotifications();
                      setFilterMenu(false);
                    }}
                  >
                    អនុវត្តតម្រង
                  </Button>
                </Space>
              </Card>
            }
            placement="bottomRight"
          >
            <Button type="text" icon={<FilterOutlined />} />
          </Dropdown>
        }
      >
        <TabPane tab="ទាំងអស់" key="all" />
        <TabPane tab={`មិនទាន់អាន (${unreadCount})`} key="unread" />
      </Tabs>

      <div className="notification-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={selectedTab === 'unread' ? 'គ្មានការជូនដំណឹងមិនទាន់អាន' : 'គ្មានការជូនដំណឹង'}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={renderNotificationItem}
            locale={{ emptyText: 'គ្មានការជូនដំណឹង' }}
          />
        )}
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div style={{ textAlign: 'center' }}>
        <Button
          type="link"
          onClick={() => {
            navigate('/notifications');
            setVisible(false);
          }}
        >
          មើលការជូនដំណឹងទាំងអស់
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown
      overlay={notificationMenu}
      visible={visible}
      onVisibleChange={setVisible}
      trigger={['click']}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small">
        <Button
          type="text"
          icon={unreadCount > 0 ? <BellFilled /> : <BellOutlined />}
          style={{ fontSize: 18 }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationCenter;
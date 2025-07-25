import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Typography, 
  Space, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  App,
  Popconfirm,
  Tag,
  Avatar,
  Upload,
  Row,
  Col,
  Dropdown,
  Tooltip,
  Badge,
  Divider,
  Switch,
  Spin
} from 'antd';
import { 
  UserAddOutlined, 
  UploadOutlined, 
  EditOutlined, 
  DeleteOutlined,
  LockOutlined,
  MoreOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { userService } from '../services/user.service';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import { authService } from '../services/auth.service';

// Define interfaces locally
interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role?: {
    id: string;
    name: string;
    displayName: string;
  };
  isActive: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  profilePicture?: string;
  school?: { name: string };
  cluster?: { name: string };
  department?: { name: string };
  province?: { name: string };
}

const { Title, Text } = Typography;
const { Option } = Select;

const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [form] = Form.useForm();
  const [uploadedFile, setUploadedFile] = useState<UploadFile | null>(null);
  const [roles, setRoles] = useState<any[]>([]);

  // Fetch users with filters
  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      console.log('Fetching users with params:', {
        page,
        limit: pageSize,
        search: searchText,
        roleId: filterRole,
        status: filterStatus,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      const response = await userService.getUsers({
        page,
        limit: pageSize,
        search: searchText,
        roleId: filterRole,
        status: filterStatus,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      console.log('Users response:', response);
      
      setUsers(response.users);
      setPagination({
        current: response.page,
        pageSize: response.limit,
        total: response.total,
      });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch users';
      if (error.response?.status !== 400) {
        message.error(errorMessage);
      }
      // Set empty data when error occurs
      setUsers([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      console.log('Fetching roles...');
      const response = await userService.getRoles();
      console.log('Roles response:', response);
      setRoles(response);
    } catch (error: any) {
      console.error('Failed to fetch roles:', error);
      // Don't show notification for roles fetch error as it's not critical
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_tokens');
    console.log('Auth token:', token);
    
    if (!token) {
      console.warn('No auth token found. User may need to login.');
      message.warning('Please login to view users');
      return;
    }
    
    fetchUsers();
    fetchRoles();
  }, [searchText, filterRole, filterStatus]);

  // Handle create/edit user
  const handleSubmit = async (values: any) => {
    try {
      const formData = new FormData();
      
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null) {
          // Handle boolean values properly for FormData
          if (typeof values[key] === 'boolean') {
            formData.append(key, values[key].toString());
          } else {
            formData.append(key, values[key]);
          }
        }
      });

      if (uploadedFile?.originFileObj) {
        formData.append('profilePicture', uploadedFile.originFileObj);
      }

      if (isEditMode && selectedUser) {
        await userService.updateUser(selectedUser.id, formData);
        message.success(t('User updated successfully'));
      } else {
        await userService.createUser(values);
        message.success(t('User created successfully'));
      }
      
      setIsModalVisible(false);
      form.resetFields();
      setUploadedFile(null);
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error: any) {
      console.error('Error creating/updating user:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred';
      message.error(errorMessage);
    }
  };

  // Handle delete user
  const handleDelete = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      message.success(t('User deleted successfully'));
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete user';
      message.error(errorMessage);
    }
  };

  // Handle reset password
  const handleResetPassword = async (userId: string) => {
    setResetPasswordLoading(true);
    try {
      const response = await userService.resetPassword(userId);
      Modal.success({
        title: t('Password Reset Successfully'),
        content: (
          <div>
            <p>{t('The temporary password is:')}</p>
            <Input.Password 
              value={response.temporaryPassword} 
              readOnly 
              style={{ marginTop: 8 }}
            />
            <p style={{ marginTop: 16, color: '#666' }}>
              {t('users.sharePasswordSecurely')}
            </p>
          </div>
        ),
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to reset password';
      message.error(errorMessage);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Handle toggle user status
  const handleToggleStatus = async (userId: string) => {
    try {
      await userService.toggleUserStatus(userId);
      message.success(t('User status updated'));
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update user status';
      message.error(errorMessage);
    }
  };

  // Table columns
  const columns: ColumnsType<User> = [
    {
      title: t('users.user'),
      key: 'user',
      width: 300,
      render: (_, record) => (
        <Space>
          <Avatar 
            size={40} 
            src={record.profilePicture} 
            icon={<UserOutlined />}
          />
          <div>
            <div>
              <Text strong>{record.fullName}</Text>
              {record.isActive ? (
                <Tag color="success" style={{ marginLeft: 8 }}>
                  <CheckCircleOutlined /> {t('users.active')}
                </Tag>
              ) : (
                <Tag color="error" style={{ marginLeft: 8 }}>
                  <CloseCircleOutlined /> {t('users.inactive')}
                </Tag>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              @{record.username}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: t('users.contact'),
      key: 'contact',
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <MailOutlined style={{ color: '#999' }} />
            <Text copyable style={{ fontSize: 13 }}>{record.email}</Text>
          </Space>
          {record.phoneNumber && (
            <Space>
              <PhoneOutlined style={{ color: '#999' }} />
              <Text style={{ fontSize: 13 }}>{record.phoneNumber}</Text>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: t('users.role'),
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: any) => {
        const roleKey = role?.name || role;
        const translationKey = `roles.${roleKey}`;
        return (
          <Tag color="blue">{t(translationKey)}</Tag>
        );
      },
      filters: roles.map(role => ({ text: t(`roles.${role.name}`), value: role.id })),
      onFilter: (value, record) => record.role?.id === value,
    },
    {
      title: t('users.location'),
      key: 'location',
      width: 200,
      render: (_, record) => {
        const locationParts = [];
        if (record.school?.name) locationParts.push(record.school.name);
        if (record.cluster?.name) locationParts.push(record.cluster.name);
        if (record.department?.name) locationParts.push(record.department.name);
        if (record.province?.name) locationParts.push(record.province.name);
        
        return locationParts.length > 0 ? (
          <Tooltip title={locationParts.join(', ')}>
            <Space>
              <EnvironmentOutlined style={{ color: '#999' }} />
              <Text ellipsis style={{ maxWidth: 150 }}>
                {locationParts.join(', ')}
              </Text>
            </Space>
          </Tooltip>
        ) : null;
      },
    },
    {
      title: t('users.lastLogin'),
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 150,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : t('users.never'),
    },
    {
      title: t('users.actions'),
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => {
        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: t('common.edit'),
            onClick: () => {
              setSelectedUser(record);
              setIsEditMode(true);
              form.setFieldsValue({
                username: record.username,
                email: record.email,
                fullName: record.fullName,
                phoneNumber: record.phoneNumber,
                roleId: record.role?.id,
                isActive: record.isActive,
              });
              setIsModalVisible(true);
            }
          },
          {
            key: 'resetPassword',
            icon: <LockOutlined />,
            label: t('users.resetPassword'),
            onClick: () => handleResetPassword(record.id)
          },
          {
            key: 'toggleStatus',
            icon: record.isActive ? <CloseCircleOutlined /> : <CheckCircleOutlined />,
            label: record.isActive ? t('users.deactivate') : t('users.activate'),
            onClick: () => handleToggleStatus(record.id)
          },
          {
            type: 'divider' as const,
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: t('common.delete'),
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: t('users.deleteTitle'),
                content: t('users.areYouSureDeleteUser'),
                onOk: () => handleDelete(record.id),
                okText: t('common.delete'),
                okButtonProps: { danger: true },
              });
            }
          }
        ];

        return (
          <Dropdown menu={{ items: menuItems }} placement="bottomRight">
            <Button 
              type="text" 
              icon={<MoreOutlined />}
              loading={resetPasswordLoading}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>{t('users.management')}</Title>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={() => fetchUsers(pagination.current, pagination.pageSize)}
              >
                {t('common.refresh')}
              </Button>
              <Button 
                type="primary" 
                icon={<UserAddOutlined />}
                onClick={() => {
                  setIsEditMode(false);
                  setSelectedUser(null);
                  form.resetFields();
                  setUploadedFile(null);
                  setIsModalVisible(true);
                }}
              >
                {t('users.addUser')}
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input
              placeholder={t('users.searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder={t('users.filterByRole')}
              value={filterRole}
              onChange={setFilterRole}
              allowClear
              style={{ width: '100%' }}
            >
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  {t(`roles.${role.name}`)}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder={t('users.filterByStatus')}
              value={filterStatus}
              onChange={setFilterStatus}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="active">{t('users.active')}</Option>
              <Option value="inactive">{t('users.inactive')}</Option>
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `${t('users.total')} ${total} ${t('users.users')}`,
            onChange: (page, pageSize) => {
              fetchUsers(page, pageSize);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        title={isEditMode ? t('users.editUser') : t('users.createUser')}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setUploadedFile(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item style={{ textAlign: 'center' }}>
                <Upload
                  listType="picture-card"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    setUploadedFile({
                      uid: file.uid,
                      name: file.name,
                      originFileObj: file,
                    } as UploadFile);
                    return false;
                  }}
                >
                  {uploadedFile ? (
                    <Avatar size={100} src={URL.createObjectURL(uploadedFile.originFileObj as File)} />
                  ) : (
                    <Avatar size={100} icon={<CameraOutlined />} />
                  )}
                </Upload>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">{t('users.clickToUploadProfilePicture')}</Text>
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label={t('users.username')}
                rules={[
                  { required: true, message: t('users.pleaseEnterUsername') },
                  { min: 3, message: t('users.usernameMustBeAtLeast3Characters') }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder={t('users.enterUsername')}
                  disabled={isEditMode}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label={t('users.fullName')}
                rules={[{ required: true, message: t('users.pleaseEnterFullName') }]}
              >
                <Input placeholder={t('users.enterFullName')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label={t('users.email')}
                rules={[
                  { required: true, message: t('users.pleaseEnterEmail') },
                  { type: 'email', message: t('users.pleaseEnterValidEmail') }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder={t('users.enterEmail')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phoneNumber"
                label={t('users.phoneNumber')}
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder={t('users.enterPhoneNumber')}
                />
              </Form.Item>
            </Col>
          </Row>

          {!isEditMode && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label={t('users.password')}
                  rules={[
                    { required: true, message: t('users.pleaseEnterPassword') },
                    { min: 6, message: t('users.passwordMustBeAtLeast6Characters') }
                  ]}
                >
                  <Input.Password 
                    prefix={<LockOutlined />} 
                    placeholder={t('users.enterPassword')}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirmPassword"
                  label={t('users.confirmPassword')}
                  dependencies={['password']}
                  rules={[
                    { required: true, message: t('users.pleaseConfirmPassword') },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error(t('users.passwordsDoNotMatch')));
                      },
                    }),
                  ]}
                >
                  <Input.Password 
                    prefix={<LockOutlined />} 
                    placeholder={t('users.confirmPassword')}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="roleId"
                label={t('users.role')}
                rules={[{ required: true, message: t('users.pleaseSelectRole') }]}
              >
                <Select placeholder={t('users.selectRole')}>
                  {roles.map(role => (
                    <Option key={role.id} value={role.id}>
                      {t(`roles.${role.name}`)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label={t('users.status')}
                valuePropName="checked"
                initialValue={!isEditMode ? true : undefined}
              >
                <Switch 
                  checkedChildren={t('users.active')} 
                  unCheckedChildren={t('users.inactive')} 
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
                setUploadedFile(null);
              }}>
                {t('common.cancel')}
              </Button>
              <Button type="primary" htmlType="submit">
                {isEditMode ? t('common.update') : t('common.create')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
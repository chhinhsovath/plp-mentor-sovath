import React, { useState } from 'react';
import { FloatButton, Modal, Button, Space, Tag, Typography, Row, Col, message } from 'antd';
import {
  SwapOutlined,
  UserOutlined,
  GlobalOutlined,
  SafetyOutlined,
  BankOutlined,
  TeamOutlined,
  SolutionOutlined,
  BookOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';

const { Text, Title } = Typography;

const RoleSwitcher: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const { user, setUser, setAccessToken } = useAuth();

  const demoRoles = [
    {
      role: 'Administrator',
      username: 'admin_demo',
      password: 'Admin@123',
      icon: <GlobalOutlined />,
      color: '#f5222d',
      description: 'គ្រប់គ្រងប្រព័ន្ធទាំងមូល',
    },
    {
      role: 'Zone',
      username: 'zone_demo',
      password: 'Zone@123',
      icon: <SafetyOutlined />,
      color: '#fa541c',
      description: 'គ្រប់គ្រងតំបន់',
    },
    {
      role: 'Provincial',
      username: 'provincial_demo',
      password: 'Provincial@123',
      icon: <BankOutlined />,
      color: '#fa8c16',
      description: 'គ្រប់គ្រងខេត្ត',
    },
    {
      role: 'Department',
      username: 'department_demo',
      password: 'Department@123',
      icon: <TeamOutlined />,
      color: '#faad14',
      description: 'ប្រធាននាយកដ្ឋាន',
    },
    {
      role: 'Cluster',
      username: 'cluster_demo',
      password: 'Cluster@123',
      icon: <SolutionOutlined />,
      color: '#52c41a',
      description: 'ប្រធានចង្កោម',
    },
    {
      role: 'Director',
      username: 'director_demo',
      password: 'Director@123',
      icon: <UserOutlined />,
      color: '#1890ff',
      description: 'នាយកសាលា',
    },
    {
      role: 'Teacher',
      username: 'teacher_demo',
      password: 'Teacher@123',
      icon: <BookOutlined />,
      color: '#722ed1',
      description: 'គ្រូបង្រៀន',
    },
  ];

  const handleRoleSwitch = async (username: string, password: string) => {
    setSwitching(true);
    try {
      const response = await authService.login({ username, password });
      
      if (response.access_token && response.user) {
        setAccessToken(response.access_token);
        setUser(response.user);
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        message.success(`Switched to ${response.user.role.name} role successfully!`);
        setIsModalOpen(false);
        
        // Reload the page to ensure all components update with new role
        window.location.reload();
      }
    } catch (error) {
      message.error('Failed to switch role. Please try again.');
    } finally {
      setSwitching(false);
    }
  };

  const currentRole = user?.role?.name || 'Unknown';
  const currentRoleConfig = demoRoles.find(r => r.role === currentRole);

  return (
    <>
      <FloatButton.Group
        trigger="hover"
        style={{ right: 24, bottom: 80 }}
        icon={<SwapOutlined />}
      >
        <FloatButton
          icon={currentRoleConfig?.icon || <UserOutlined />}
          tooltip={`Current: ${currentRole}`}
          onClick={() => setIsModalOpen(true)}
          badge={{ dot: true }}
        />
      </FloatButton.Group>

      <Modal
        title={
          <Space>
            <SwapOutlined />
            <span>Quick Role Switcher - ប្តូរតួនាទីរហ័ស</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Text>Current Role: </Text>
            <Tag 
              icon={currentRoleConfig?.icon} 
              color={currentRoleConfig?.color}
              style={{ fontSize: 16, padding: '4px 12px' }}
            >
              {currentRole}
            </Tag>
          </div>

          <Title level={5}>Switch to Another Role:</Title>
          
          <Row gutter={[12, 12]}>
            {demoRoles.map((demo) => {
              const isCurrent = demo.role === currentRole;
              return (
                <Col key={demo.username} xs={24} sm={12} md={8}>
                  <Button
                    type={isCurrent ? 'default' : 'primary'}
                    icon={demo.icon}
                    onClick={() => handleRoleSwitch(demo.username, demo.password)}
                    disabled={isCurrent || switching}
                    loading={switching}
                    style={{ 
                      width: '100%',
                      height: 'auto',
                      padding: '12px',
                      backgroundColor: isCurrent ? undefined : demo.color,
                      borderColor: isCurrent ? undefined : demo.color,
                    }}
                    size="large"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>
                        {demo.role}
                        {isCurrent && (
                          <CheckCircleOutlined 
                            style={{ marginLeft: 8, color: '#52c41a' }} 
                          />
                        )}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.9 }}>
                        {demo.description}
                      </div>
                    </div>
                  </Button>
                </Col>
              );
            })}
          </Row>

          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            backgroundColor: '#f0f2f5', 
            borderRadius: 8 
          }}>
            <Text type="secondary">
              <strong>Note:</strong> Switching roles will reload the page to update all permissions and menu items.
            </Text>
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default RoleSwitcher;
import React from 'react';
import { Card, Button, Space, Tag, Tooltip, Typography, Row, Col, Divider } from 'antd';
import {
  UserOutlined,
  GlobalOutlined,
  SafetyOutlined,
  BankOutlined,
  TeamOutlined,
  SolutionOutlined,
  BookOutlined,
  LoginOutlined,
  CrownOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface QuickLoginProps {
  onSelectRole: (username: string, password: string) => void;
}

const QuickRoleLogin: React.FC<QuickLoginProps> = ({ onSelectRole }) => {
  const demoRoles = [
    {
      role: 'Administrator',
      username: 'admin_demo',
      password: 'Admin@123',
      icon: <GlobalOutlined />,
      color: '#f5222d',
      description: 'គ្រប់គ្រងប្រព័ន្ធទាំងមូល',
      access: 'Full System Access',
    },
    {
      role: 'Zone',
      username: 'zone_demo',
      password: 'Zone@123',
      icon: <SafetyOutlined />,
      color: '#fa541c',
      description: 'គ្រប់គ្រងតំបន់',
      access: 'Regional Management',
    },
    {
      role: 'Provincial',
      username: 'provincial_demo',
      password: 'Provincial@123',
      icon: <BankOutlined />,
      color: '#fa8c16',
      description: 'គ្រប់គ្រងខេត្ត',
      access: 'Province Management',
    },
    {
      role: 'Department',
      username: 'department_demo',
      password: 'Department@123',
      icon: <TeamOutlined />,
      color: '#faad14',
      description: 'ប្រធាននាយកដ្ឋាន',
      access: 'Department Head',
    },
    {
      role: 'Cluster',
      username: 'cluster_demo',
      password: 'Cluster@123',
      icon: <SolutionOutlined />,
      color: '#52c41a',
      description: 'ប្រធានចង្កោម',
      access: 'Cluster Manager',
    },
    {
      role: 'Director',
      username: 'director_demo',
      password: 'Director@123',
      icon: <UserOutlined />,
      color: '#1890ff',
      description: 'នាយកសាលា',
      access: 'School Principal',
    },
    {
      role: 'Teacher',
      username: 'teacher_demo',
      password: 'Teacher@123',
      icon: <BookOutlined />,
      color: '#722ed1',
      description: 'គ្រូបង្រៀន',
      access: 'Basic Access',
    },
  ];

  return (
    <Card 
      title={
        <Space>
          <CrownOutlined style={{ color: '#faad14' }} />
          <span>ចូលប្រើរហ័ស - សម្រាប់ធ្វើតេស្តតួនាទី</span>
        </Space>
      }
      style={{ marginTop: 24 }}
      bordered={false}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Text type="secondary">
          ចុចប៊ូតុងខាងក្រោមដើម្បីចូលប្រើប្រាស់ជាមួយតួនាទីផ្សេងៗ
        </Text>
        
        <Row gutter={[8, 8]}>
          {demoRoles.map((demo) => (
            <Col key={demo.username} xs={12} sm={8} md={6} lg={6} xl={6} xxl={4}>
              <Tooltip 
                title={
                  <div>
                    <div>ឈ្មោះអ្នកប្រើ: {demo.username}</div>
                    <div>ពាក្យសម្ងាត់: {demo.password}</div>
                    <div>សិទ្ធិ: {demo.access}</div>
                  </div>
                }
              >
                <Button
                  type="primary"
                  icon={demo.icon}
                  onClick={() => onSelectRole(demo.username, demo.password)}
                  style={{ 
                    width: '100%',
                    height: 'auto',
                    padding: '8px 4px',
                    backgroundColor: demo.color,
                    borderColor: demo.color,
                  }}
                  size="middle"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.2 }}>{demo.role}</div>
                    <div style={{ fontSize: '11px', opacity: 0.9, lineHeight: 1.2 }}>{demo.description}</div>
                  </div>
                </Button>
              </Tooltip>
            </Col>
          ))}
        </Row>

        <Divider />
        
        <div style={{ backgroundColor: '#f0f2f5', padding: 8, borderRadius: 8 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 4, fontSize: 14 }}>សង្ខេបមុខងារតាមតួនាទី:</Title>
          <Row gutter={[8, 4]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
                <Text style={{ fontSize: 12 }}><Tag color="red" style={{ fontSize: 11 }}>រដ្ឋបាល</Tag> មុខងារទាំងអស់ + កំណត់ប្រព័ន្ធ</Text>
                <Text style={{ fontSize: 12 }}><Tag color="orange" style={{ fontSize: 11 }}>តំបន់/ខេត្ត</Tag> អនុម័តបេសកកម្ម + វិភាគ</Text>
                <Text style={{ fontSize: 12 }}><Tag color="gold" style={{ fontSize: 11 }}>នាយកដ្ឋាន</Tag> គ្រប់គ្រងទម្រង់ + មើលរបាយការណ៍</Text>
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
                <Text style={{ fontSize: 12 }}><Tag color="green" style={{ fontSize: 11 }}>ចង្កោម</Tag> មើលសាលាច្រើន</Text>
                <Text style={{ fontSize: 12 }}><Tag color="blue" style={{ fontSize: 11 }}>នាយក</Tag> អនុម័តបេសកកម្មសាលា</Text>
                <Text style={{ fontSize: 12 }}><Tag color="purple" style={{ fontSize: 11 }}>គ្រូ</Tag> បង្កើតការសង្កេតតែប៉ុណ្ណោះ</Text>
              </Space>
            </Col>
          </Row>
        </div>
      </Space>
    </Card>
  );
};

export default QuickRoleLogin;
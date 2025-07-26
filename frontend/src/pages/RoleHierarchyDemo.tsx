import React, { useState } from 'react';
import {
  Card,
  Typography,
  Table,
  Tag,
  Space,
  Alert,
  Divider,
  Row,
  Col,
  Button,
  Modal,
  List,
  Badge,
  Tooltip,
  Tabs,
} from 'antd';
import {
  UserOutlined,
  SafetyOutlined,
  GlobalOutlined,
  BankOutlined,
  TeamOutlined,
  SolutionOutlined,
  BookOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  FormOutlined,
  FileTextOutlined,
  BarChartOutlined,
  DashboardOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface RoleAccess {
  role: string;
  description: string;
  canView: string;
  manages: string[];
  canApproveMissions: boolean;
  menuAccess: string[];
  formAccess: {
    studentAssessment: boolean;
    teacherAssessment: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canApprove: boolean;
  };
}

const RoleHierarchyDemo: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  const roleData: RoleAccess[] = [
    {
      role: 'Administrator',
      description: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ - Full system access',
      canView: 'All nationwide',
      manages: ['Zone', 'Provincial', 'Department', 'Cluster', 'Director', 'Teacher'],
      canApproveMissions: true,
      menuAccess: [
        'ផ្ទាំងគ្រប់គ្រង',
        'ការសង្កេត',
        'បេសកកម្ម',
        'ទម្រង់វាយតម្លៃ',
        'ការស្ទង់មតិ',
        'ផ្ទាំងវិភាគ',
        'របាយការណ៍',
        'ដំណើរការ',
        'អ្នកប្រើប្រាស់',
        'សាលារៀន',
        'សុវត្ថិភាព',
        'បម្រុងទុក',
      ],
      formAccess: {
        studentAssessment: true,
        teacherAssessment: true,
        canCreate: true,
        canEdit: true,
        canApprove: true,
      },
    },
    {
      role: 'Zone',
      description: 'អ្នកគ្រប់គ្រងតំបន់ - Regional manager',
      canView: 'All in Zone',
      manages: ['Provincial', 'Department', 'Cluster', 'Director', 'Teacher'],
      canApproveMissions: true,
      menuAccess: [
        'ផ្ទាំងគ្រប់គ្រង',
        'ការសង្កេត',
        'បេសកកម្ម',
        'ផ្ទាំងវិភាគ',
        'របាយការណ៍',
        'អ្នកប្រើប្រាស់',
      ],
      formAccess: {
        studentAssessment: true,
        teacherAssessment: true,
        canCreate: true,
        canEdit: true,
        canApprove: true,
      },
    },
    {
      role: 'Provincial',
      description: 'អ្នកគ្រប់គ្រងខេត្ត - Provincial manager',
      canView: 'All in Province',
      manages: ['Department', 'Cluster', 'Director', 'Teacher'],
      canApproveMissions: true,
      menuAccess: [
        'ផ្ទាំងគ្រប់គ្រង',
        'ការសង្កេត',
        'បេសកកម្ម',
        'ផ្ទាំងវិភាគ',
        'របាយការណ៍',
        'អ្នកប្រើប្រាស់',
      ],
      formAccess: {
        studentAssessment: true,
        teacherAssessment: true,
        canCreate: true,
        canEdit: true,
        canApprove: true,
      },
    },
    {
      role: 'Department',
      description: 'ប្រធាននាយកដ្ឋាន - Department head',
      canView: 'Department & Cluster',
      manages: ['Cluster', 'Director', 'Teacher'],
      canApproveMissions: false,
      menuAccess: [
        'ផ្ទាំងគ្រប់គ្រង',
        'ការសង្កេត',
        'ទម្រង់វាយតម្លៃ',
        'ផ្ទាំងវិភាគ',
        'របាយការណ៍',
        'អ្នកប្រើប្រាស់',
      ],
      formAccess: {
        studentAssessment: true,
        teacherAssessment: true,
        canCreate: true,
        canEdit: true,
        canApprove: false,
      },
    },
    {
      role: 'Cluster',
      description: 'ប្រធានចង្កោម - Cluster manager',
      canView: 'Cluster staff',
      manages: ['Director', 'Teacher'],
      canApproveMissions: false,
      menuAccess: [
        'ផ្ទាំងគ្រប់គ្រង',
        'ការសង្កេត',
        'ផ្ទាំងវិភាគ',
        'របាយការណ៍',
      ],
      formAccess: {
        studentAssessment: true,
        teacherAssessment: true,
        canCreate: true,
        canEdit: true,
        canApprove: false,
      },
    },
    {
      role: 'Director',
      description: 'នាយកសាលា - School principal',
      canView: 'Teachers in school',
      manages: ['Teacher'],
      canApproveMissions: true,
      menuAccess: [
        'ផ្ទាំងគ្រប់គ្រង',
        'ការសង្កេត',
        'របាយការណ៍',
        'ផ្ទាំងវិភាគ',
      ],
      formAccess: {
        studentAssessment: true,
        teacherAssessment: true,
        canCreate: true,
        canEdit: true,
        canApprove: true,
      },
    },
    {
      role: 'Teacher',
      description: 'គ្រូបង្រៀន - Teacher',
      canView: 'Self only',
      manages: [],
      canApproveMissions: false,
      menuAccess: [
        'ផ្ទាំងគ្រប់គ្រង',
        'ការសង្កេត',
      ],
      formAccess: {
        studentAssessment: true,
        teacherAssessment: false,
        canCreate: true,
        canEdit: false,
        canApprove: false,
      },
    },
  ];

  const loginCredentials = [
    { role: 'Administrator', username: 'admin_demo', password: 'Admin@123' },
    { role: 'Zone', username: 'zone_demo', password: 'Zone@123' },
    { role: 'Provincial', username: 'provincial_demo', password: 'Provincial@123' },
    { role: 'Department', username: 'department_demo', password: 'Department@123' },
    { role: 'Cluster', username: 'cluster_demo', password: 'Cluster@123' },
    { role: 'Director', username: 'director_demo', password: 'Director@123' },
    { role: 'Teacher', username: 'teacher_demo', password: 'Teacher@123' },
  ];

  const roleIcons: Record<string, React.ReactNode> = {
    Administrator: <GlobalOutlined />,
    Zone: <SafetyOutlined />,
    Provincial: <BankOutlined />,
    Department: <TeamOutlined />,
    Cluster: <SolutionOutlined />,
    Director: <UserOutlined />,
    Teacher: <BookOutlined />,
  };

  const columns = [
    {
      title: 'តួនាទី',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Space>
          {roleIcons[role]}
          <Text strong>{role}</Text>
        </Space>
      ),
    },
    {
      title: 'សិទ្ធិមើល',
      dataIndex: 'canView',
      key: 'canView',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'គ្រប់គ្រង',
      dataIndex: 'manages',
      key: 'manages',
      render: (manages: string[]) => (
        <Space wrap>
          {manages.map((role) => (
            <Tag key={role} color="green">
              {role}
            </Tag>
          ))}
          {manages.length === 0 && <Text type="secondary">គ្មាន</Text>}
        </Space>
      ),
    },
    {
      title: 'អនុម័តបេសកកម្ម',
      dataIndex: 'canApproveMissions',
      key: 'canApproveMissions',
      render: (can: boolean) =>
        can ? (
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
        ) : (
          <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
        ),
    },
    {
      title: 'សកម្មភាព',
      key: 'actions',
      render: (_: any, record: RoleAccess) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setSelectedRole(record.role)}
          >
            មើលលម្អិត
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>បង្ហាញឋានានុក្រមតួនាទី</Title>
        <Paragraph>
          ប្រព័ន្ធគ្រប់គ្រងតួនាទី និងសិទ្ធិចូលប្រើប្រាស់សម្រាប់ប្រព័ន្ធ PLP Mentor
        </Paragraph>

        <Alert
          message="មានព័ត៌មានចូលប្រើប្រាស់"
          description="ចុចប៊ូតុង 'មើលព័ត៌មានចូលប្រើ' ដើម្បីមើលព័ត៌មានគណនីសាកល្បងសម្រាប់តួនាទីនីមួយៗ"
          type="info"
          showIcon
          action={
            <Button size="small" onClick={() => setLoginModalVisible(true)}>
              មើលព័ត៌មានចូលប្រើ
            </Button>
          }
          style={{ marginBottom: 24 }}
        />

        <Table
          columns={columns}
          dataSource={roleData}
          rowKey="role"
          pagination={false}
        />

        <Divider />

        <Title level={3}>សិទ្ធិចូលប្រើទម្រង់តាមតួនាទី</Title>
        <Row gutter={[16, 16]}>
          {roleData.map((role) => (
            <Col key={role.role} xs={24} sm={12} md={8} lg={6}>
              <Card
                title={
                  <Space>
                    {roleIcons[role.role]}
                    {role.role}
                  </Space>
                }
                size="small"
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary">វាយតម្លៃសិស្ស:</Text>
                    {role.formAccess.studentAssessment ? (
                      <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />
                    )}
                  </div>
                  <div>
                    <Text type="secondary">វាយតម្លៃគ្រូ:</Text>
                    {role.formAccess.teacherAssessment ? (
                      <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />
                    )}
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  <Space wrap>
                    {role.formAccess.canCreate && (
                      <Tag color="blue" icon={<FormOutlined />}>
                        បង្កើត
                      </Tag>
                    )}
                    {role.formAccess.canEdit && (
                      <Tag color="orange" icon={<FormOutlined />}>
                        កែសម្រួល
                      </Tag>
                    )}
                    {role.formAccess.canApprove && (
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        អនុម័ត
                      </Tag>
                    )}
                  </Space>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Role Details Modal */}
      <Modal
        title={`ព័ត៌មានលម្អិតតួនាទី: ${selectedRole}`}
        open={!!selectedRole}
        onCancel={() => setSelectedRole(null)}
        footer={null}
        width={800}
      >
        {selectedRole && (
          <Tabs defaultActiveKey="1">
            <TabPane tab="សិទ្ធិចូលប្រើម៉ឺនុយ" key="1">
              <List
                dataSource={roleData.find((r) => r.role === selectedRole)?.menuAccess || []}
                renderItem={(menu) => (
                  <List.Item>
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      {menu}
                    </Space>
                  </List.Item>
                )}
              />
            </TabPane>
            <TabPane tab="សិទ្ធិប្រើប្រាស់ទម្រង់" key="2">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message="ទម្រង់វាយតម្លៃសិស្ស"
                  description={
                    roleData.find((r) => r.role === selectedRole)?.formAccess.studentAssessment
                      ? 'អាចចូលប្រើ និងបង្កើតទម្រង់វាយតម្លៃសិស្ស'
                      : 'មិនមានសិទ្ធិចូលប្រើទម្រង់វាយតម្លៃសិស្ស'
                  }
                  type={
                    roleData.find((r) => r.role === selectedRole)?.formAccess.studentAssessment
                      ? 'success'
                      : 'error'
                  }
                  showIcon
                />
                <Alert
                  message="ទម្រង់វាយតម្លៃគ្រូ"
                  description={
                    roleData.find((r) => r.role === selectedRole)?.formAccess.teacherAssessment
                      ? 'អាចចូលប្រើ និងវាយតម្លៃការបង្រៀនរបស់គ្រូ'
                      : 'មិនមានសិទ្ធិចូលប្រើទម្រង់វាយតម្លៃគ្រូ'
                  }
                  type={
                    roleData.find((r) => r.role === selectedRole)?.formAccess.teacherAssessment
                      ? 'success'
                      : 'error'
                  }
                  showIcon
                />
              </Space>
            </TabPane>
            <TabPane tab="វិសាលភាពគ្រប់គ្រង" key="3">
              <Paragraph>
                <Text strong>សិទ្ធិមើល: </Text>
                {roleData.find((r) => r.role === selectedRole)?.canView}
              </Paragraph>
              <Paragraph>
                <Text strong>អាចគ្រប់គ្រង: </Text>
                {roleData.find((r) => r.role === selectedRole)?.manages.join(', ') || 'គ្មាន'}
              </Paragraph>
              <Paragraph>
                <Text strong>ពិពណ៌នា: </Text>
                {roleData.find((r) => r.role === selectedRole)?.description}
              </Paragraph>
            </TabPane>
          </Tabs>
        )}
      </Modal>

      {/* Login Credentials Modal */}
      <Modal
        title="ព័ត៌មានចូលប្រើអ្នកប្រើសាកល្បង"
        open={loginModalVisible}
        onCancel={() => setLoginModalVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="សំខាន់"
          description="ទាំងនេះជាគណនីសាកល្បងសម្រាប់ធ្វើតេស្តសិទ្ធិតាមតួនាទី។ ប្រើវាដើម្បីចូលប្រើ និងមើលរបៀបដែលតួនាទីផ្សេងៗធ្វើអន្តរកម្មជាមួយប្រព័ន្ធ។"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <List
          dataSource={loginCredentials}
          renderItem={(cred) => (
            <List.Item>
              <List.Item.Meta
                avatar={roleIcons[cred.role]}
                title={cred.role}
                description={
                  <Space direction="vertical">
                    <Text code>ឈ្មោះអ្នកប្រើ: {cred.username}</Text>
                    <Text code>ពាក្យសម្ងាត់: {cred.password}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default RoleHierarchyDemo;
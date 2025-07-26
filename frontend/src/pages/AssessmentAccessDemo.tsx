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
  Tabs,
  Steps,
} from 'antd';
import {
  UserOutlined,
  FormOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  LockOutlined,
  UnlockOutlined,
  TeamOutlined,
  SolutionOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Step } = Steps;

const AssessmentAccessDemo: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const assessmentScenarios = [
    {
      key: 'teacher-self-assessment',
      title: 'គ្រូបង្រៀនវាយតម្លៃសិស្ស (Teacher Assessing Students)',
      description: 'គ្រូបង្រៀនអាចបង្កើត និងកែសម្រួលការវាយតម្លៃសិស្សរបស់ខ្លួន',
      icon: <SolutionOutlined />,
      steps: [
        {
          role: 'Teacher',
          action: 'បង្កើតទម្រង់វាយតម្លៃសិស្សថ្មី',
          allowed: true,
          description: 'គ្រូអាចបង្កើតទម្រង់វាយតម្លៃសម្រាប់សិស្សក្នុងថ្នាក់របស់ខ្លួន',
        },
        {
          role: 'Teacher',
          action: 'កែសម្រួលការវាយតម្លៃរបស់ខ្លួន',
          allowed: false,
          description: 'មិនអាចកែសម្រួលបន្ទាប់ពីបញ្ជូន',
        },
        {
          role: 'Director',
          action: 'មើល និងអនុម័តការវាយតម្លៃ',
          allowed: true,
          description: 'នាយកសាលាអាចមើល និងអនុម័តការវាយតម្លៃទាំងអស់ក្នុងសាលា',
        },
      ],
    },
    {
      key: 'director-teacher-assessment',
      title: 'នាយកសាលាវាយតម្លៃគ្រូ (Director Assessing Teachers)',
      description: 'នាយកសាលាវាយតម្លៃការបង្រៀនរបស់គ្រូ',
      icon: <TeamOutlined />,
      steps: [
        {
          role: 'Director',
          action: 'បង្កើតទម្រង់វាយតម្លៃគ្រូ',
          allowed: true,
          description: 'នាយកសាលាអាចបង្កើតទម្រង់វាយតម្លៃសម្រាប់គ្រូក្នុងសាលា',
        },
        {
          role: 'Director',
          action: 'ផ្តល់ពិន្ទុ និងមតិយោបល់',
          allowed: true,
          description: 'វាយតម្លៃការបង្រៀន និងផ្តល់មតិកែលម្អ',
        },
        {
          role: 'Teacher',
          action: 'មើលការវាយតម្លៃរបស់ខ្លួន',
          allowed: true,
          description: 'គ្រូអាចមើលការវាយតម្លៃដែលនាយកសាលាធ្វើលើខ្លួន',
        },
        {
          role: 'Teacher',
          action: 'កែសម្រួលការវាយតម្លៃ',
          allowed: false,
          description: 'គ្រូមិនអាចកែការវាយតម្លៃដែលនាយកធ្វើលើខ្លួន',
        },
      ],
    },
    {
      key: 'cluster-oversight',
      title: 'ប្រធានចង្កោមត្រួតពិនិត្យ (Cluster Manager Oversight)',
      description: 'ប្រធានចង្កោមត្រួតពិនិត្យការវាយតម្លៃក្នុងសាលាទាំងអស់',
      icon: <EyeOutlined />,
      steps: [
        {
          role: 'Cluster',
          action: 'មើលការវាយតម្លៃទាំងអស់ក្នុងចង្កោម',
          allowed: true,
          description: 'អាចមើលការវាយតម្លៃសិស្ស និងគ្រូក្នុងសាលាទាំងអស់',
        },
        {
          role: 'Cluster',
          action: 'បង្កើតរបាយការណ៍សង្ខេប',
          allowed: true,
          description: 'បង្កើតរបាយការណ៍វិភាគការវាយតម្លៃ',
        },
        {
          role: 'Cluster',
          action: 'កែសម្រួលការវាយតម្លៃ',
          allowed: false,
          description: 'មិនអាចកែសម្រួលការវាយតម្លៃដែលគេធ្វើរួច',
        },
        {
          role: 'Cluster',
          action: 'អនុម័តបេសកកម្ម',
          allowed: false,
          description: 'មិនមានសិទ្ធិអនុម័តបេសកកម្ម',
        },
      ],
    },
    {
      key: 'provincial-analysis',
      title: 'ការវិភាគថ្នាក់ខេត្ត (Provincial Level Analysis)',
      description: 'អ្នកគ្រប់គ្រងខេត្តវិភាគការវាយតម្លៃទូទាំងខេត្ត',
      icon: <FileTextOutlined />,
      steps: [
        {
          role: 'Provincial',
          action: 'មើលការវាយតម្លៃទាំងអស់ក្នុងខេត្ត',
          allowed: true,
          description: 'អាចមើលគ្រប់ការវាយតម្លៃក្នុងខេត្ត',
        },
        {
          role: 'Provincial',
          action: 'បង្កើតគោលការណ៍វាយតម្លៃ',
          allowed: true,
          description: 'កំណត់ស្តង់ដារវាយតម្លៃសម្រាប់ខេត្ត',
        },
        {
          role: 'Provincial',
          action: 'អនុម័តបេសកកម្ម',
          allowed: true,
          description: 'អាចអនុម័តបេសកកម្មសម្រាប់បុគ្គលិកក្នុងខេត្ត',
        },
        {
          role: 'Provincial',
          action: 'បណ្តុះបណ្តាលគ្រូ',
          allowed: true,
          description: 'រៀបចំការបណ្តុះបណ្តាលផ្អែកលើការវាយតម្លៃ',
        },
      ],
    },
  ];

  const roleAccessMatrix = [
    {
      role: 'Teacher',
      studentAssessment: { create: true, view: 'Own', edit: false, approve: false },
      teacherAssessment: { create: false, view: 'Own', edit: false, approve: false },
      permissions: ['បង្កើតការវាយតម្លៃសិស្ស', 'មើលការវាយតម្លៃផ្ទាល់ខ្លួន'],
    },
    {
      role: 'Director',
      studentAssessment: { create: true, view: 'School', edit: true, approve: true },
      teacherAssessment: { create: true, view: 'School', edit: true, approve: true },
      permissions: ['វាយតម្លៃគ្រូ', 'អនុម័តការវាយតម្លៃ', 'អនុម័តបេសកកម្ម'],
    },
    {
      role: 'Cluster',
      studentAssessment: { create: true, view: 'Cluster', edit: true, approve: false },
      teacherAssessment: { create: true, view: 'Cluster', edit: true, approve: false },
      permissions: ['ត្រួតពិនិត្យសាលាច្រើន', 'បង្កើតរបាយការណ៍', 'មិនអាចអនុម័តបេសកកម្ម'],
    },
    {
      role: 'Department',
      studentAssessment: { create: true, view: 'Department', edit: true, approve: false },
      teacherAssessment: { create: true, view: 'Department', edit: true, approve: false },
      permissions: ['គ្រប់គ្រងចង្កោម', 'វិភាគទិន្នន័យ', 'មិនអាចអនុម័តបេសកកម្ម'],
    },
    {
      role: 'Provincial',
      studentAssessment: { create: true, view: 'Province', edit: true, approve: true },
      teacherAssessment: { create: true, view: 'Province', edit: true, approve: true },
      permissions: ['គ្រប់គ្រងខេត្ត', 'អនុម័តបេសកកម្ម', 'កំណត់គោលការណ៍'],
    },
    {
      role: 'Zone',
      studentAssessment: { create: true, view: 'Zone', edit: true, approve: true },
      teacherAssessment: { create: true, view: 'Zone', edit: true, approve: true },
      permissions: ['គ្រប់គ្រងតំបន់', 'អនុម័តបេសកកម្ម', 'សម្របសម្រួលខេត្ត'],
    },
    {
      role: 'Administrator',
      studentAssessment: { create: true, view: 'All', edit: true, approve: true },
      teacherAssessment: { create: true, view: 'All', edit: true, approve: true },
      permissions: ['សិទ្ធិពេញលេញ', 'គ្រប់គ្រងប្រព័ន្ធ', 'កំណត់រចនាសម្ព័ន្ធ'],
    },
  ];

  const getAccessIcon = (access: boolean | string) => {
    if (access === true) return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    if (access === false) return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    return <Tag color="blue">{access}</Tag>;
  };

  const columns = [
    {
      title: 'តួនាទី',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Text strong>{role}</Text>,
    },
    {
      title: 'ការវាយតម្លៃសិស្ស',
      children: [
        {
          title: 'បង្កើត',
          key: 'student_create',
          render: (record: any) => getAccessIcon(record.studentAssessment.create),
        },
        {
          title: 'មើល',
          key: 'student_view',
          render: (record: any) => getAccessIcon(record.studentAssessment.view),
        },
        {
          title: 'កែ',
          key: 'student_edit',
          render: (record: any) => getAccessIcon(record.studentAssessment.edit),
        },
        {
          title: 'អនុម័ត',
          key: 'student_approve',
          render: (record: any) => getAccessIcon(record.studentAssessment.approve),
        },
      ],
    },
    {
      title: 'ការវាយតម្លៃគ្រូ',
      children: [
        {
          title: 'បង្កើត',
          key: 'teacher_create',
          render: (record: any) => getAccessIcon(record.teacherAssessment.create),
        },
        {
          title: 'មើល',
          key: 'teacher_view',
          render: (record: any) => getAccessIcon(record.teacherAssessment.view),
        },
        {
          title: 'កែ',
          key: 'teacher_edit',
          render: (record: any) => getAccessIcon(record.teacherAssessment.edit),
        },
        {
          title: 'អនុម័ត',
          key: 'teacher_approve',
          render: (record: any) => getAccessIcon(record.teacherAssessment.approve),
        },
      ],
    },
    {
      title: 'សិទ្ធិសំខាន់ៗ',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <Space wrap>
          {permissions.map((perm, idx) => (
            <Tag key={idx} color="purple">
              {perm}
            </Tag>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>បង្ហាញសិទ្ធិវាយតម្លៃសិស្ស និងគ្រូ</Title>
        <Paragraph>
          ការគ្រប់គ្រងសិទ្ធិចូលប្រើទម្រង់វាយតម្លៃសិស្ស និងគ្រូតាមតួនាទី
        </Paragraph>

        <Alert
          message="ព័ត៌មានសំខាន់"
          description="ប្រព័ន្ធនេះអនុញ្ញាតឱ្យតួនាទីនីមួយៗមានសិទ្ធិផ្សេងៗគ្នាក្នុងការបង្កើត មើល កែសម្រួល និងអនុម័តការវាយតម្លៃ"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Tabs defaultActiveKey="1">
          <TabPane tab="តារាងសិទ្ធិតាមតួនាទី" key="1">
            <Table
              columns={columns}
              dataSource={roleAccessMatrix}
              rowKey="role"
              pagination={false}
              bordered
            />
          </TabPane>

          <TabPane tab="ឧទាហរណ៍ការប្រើប្រាស់" key="2">
            <Row gutter={[16, 16]}>
              {assessmentScenarios.map((scenario) => (
                <Col key={scenario.key} xs={24} md={12}>
                  <Card
                    hoverable
                    onClick={() => setSelectedScenario(scenario.key)}
                    style={{ height: '100%' }}
                  >
                    <Space align="start">
                      <div style={{ fontSize: 32 }}>{scenario.icon}</div>
                      <div>
                        <Title level={4} style={{ margin: 0 }}>
                          {scenario.title}
                        </Title>
                        <Paragraph style={{ marginBottom: 0 }}>
                          {scenario.description}
                        </Paragraph>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>

          <TabPane tab="ការរឹតបន្តឹងសិទ្ធិ" key="3">
            <List
              dataSource={[
                {
                  title: 'គ្រូបង្រៀន',
                  restrictions: [
                    'មិនអាចកែសម្រួលការវាយតម្លៃបន្ទាប់ពីបញ្ជូន',
                    'មិនអាចមើលការវាយតម្លៃរបស់គ្រូដទៃ',
                    'មិនអាចអនុម័តបេសកកម្ម',
                  ],
                },
                {
                  title: 'នាយកសាលា',
                  restrictions: [
                    'អាចមើលតែការវាយតម្លៃក្នុងសាលារបស់ខ្លួន',
                    'មិនអាចកែគោលការណ៍វាយតម្លៃថ្នាក់ខេត្ត',
                  ],
                },
                {
                  title: 'ប្រធានចង្កោម',
                  restrictions: [
                    'មិនអាចអនុម័តបេសកកម្ម',
                    'មិនអាចកែការវាយតម្លៃដែលអនុម័តរួច',
                  ],
                },
                {
                  title: 'ប្រធាននាយកដ្ឋាន',
                  restrictions: [
                    'មិនអាចអនុម័តបេសកកម្ម',
                    'អាចមើលតែទិន្នន័យក្នុងនាយកដ្ឋាន',
                  ],
                },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<LockOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />}
                    title={item.title}
                    description={
                      <ul>
                        {item.restrictions.map((restriction, idx) => (
                          <li key={idx}>{restriction}</li>
                        ))}
                      </ul>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Scenario Details Modal */}
      <Modal
        title={assessmentScenarios.find((s) => s.key === selectedScenario)?.title}
        open={!!selectedScenario}
        onCancel={() => setSelectedScenario(null)}
        footer={null}
        width={800}
      >
        {selectedScenario && (
          <Steps
            direction="vertical"
            current={-1}
            items={assessmentScenarios
              .find((s) => s.key === selectedScenario)
              ?.steps.map((step) => ({
                title: `${step.role}: ${step.action}`,
                description: step.description,
                status: step.allowed ? 'process' : 'error',
                icon: step.allowed ? <UnlockOutlined /> : <LockOutlined />,
              }))}
          />
        )}
      </Modal>
    </div>
  );
};

export default AssessmentAccessDemo;
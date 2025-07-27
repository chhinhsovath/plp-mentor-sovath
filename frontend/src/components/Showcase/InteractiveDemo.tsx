import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Modal,
  Tag,
  Timeline,
  Avatar,
  List,
  Badge,
  Tooltip,
  Progress,
  Rate,
  Divider,
  Row,
  Col,
  Statistic,
  Alert
} from 'antd';
import {
  PlayCircleOutlined,
  EyeOutlined,
  EditOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SmileOutlined,
  SafetyOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface DemoFeature {
  id: string;
  title: string;
  description: string;
  duration: string;
  steps: string[];
  preview?: React.ReactNode;
}

const InteractiveDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const demoFeatures: DemoFeature[] = [
    {
      id: 'observation',
      title: 'ការសង្កេតថ្នាក់រៀន',
      description: 'មើលរបៀបធ្វើការសង្កេតថ្នាក់រៀនជាក់ស្តែង',
      duration: '៣ នាទី',
      steps: [
        'ជ្រើសរើសថ្នាក់រៀននិងគ្រូបង្រៀន',
        'បំពេញទម្រង់សង្កេតតាមពេលវេលាជាក់ស្តែង',
        'ផ្តល់មតិយោបល់លម្អិត',
        'បញ្ចូលហត្ថលេខាឌីជីថល',
        'រក្សាទុកនិងបញ្ជូនរបាយការណ៍'
      ],
      preview: (
        <Card style={{ background: '#f0f2f5' }}>
          <Title level={5}>ទម្រង់សង្កេតសាកល្បង</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>គ្រូបង្រៀន:</Text> <Tag color="blue">លោក សុខ សុភា</Tag>
            </div>
            <div>
              <Text strong>មុខវិជ្ជា:</Text> <Tag color="green">គណិតវិទ្យា</Tag>
            </div>
            <div>
              <Text strong>ថ្នាក់:</Text> <Tag color="orange">ថ្នាក់ទី៧</Tag>
            </div>
            <Progress percent={75} status="active" />
            <Rate defaultValue={4} disabled />
          </Space>
        </Card>
      )
    },
    {
      id: 'analytics',
      title: 'ផ្ទាំងគ្រប់គ្រងវិភាគទិន្នន័យ',
      description: 'ស្វែងយល់ពីរបៀបវិភាគទិន្នន័យនិងរបាយការណ៍',
      duration: '២ នាទី',
      steps: [
        'ចូលមើលផ្ទាំងគ្រប់គ្រង',
        'ជ្រើសរើសប្រភេទរបាយការណ៍',
        'កំណត់ចន្លោះពេលវេលា',
        'មើលក្រាហ្វិកនិងតារាង',
        'នាំចេញរបាយការណ៍'
      ],
      preview: (
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <Card size="small">
              <Statistic title="ការសង្កេតសរុប" value={1234} />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Statistic title="ពិន្ទុមធ្យម" value={85} suffix="%" />
            </Card>
          </Col>
          <Col span={24}>
            <Progress percent={78} strokeColor="#52c41a" />
            <Text type="secondary">កំណើនគុណភាពបង្រៀន</Text>
          </Col>
        </Row>
      )
    },
    {
      id: 'mission',
      title: 'គ្រប់គ្រងបេសកកម្ម',
      description: 'របៀបបង្កើតនិងតាមដានបេសកកម្ម',
      duration: '២ នាទី',
      steps: [
        'បង្កើតបេសកកម្មថ្មី',
        'កំណត់គោលដៅនិងសកម្មភាព',
        'ចាត់តាំងសមាជិកក្រុម',
        'តាមដានវឌ្ឍនភាព',
        'បញ្ចប់និងវាយតម្លៃ'
      ],
      preview: (
        <Timeline mode="left">
          <Timeline.Item color="green">
            <Text strong>បង្កើតបេសកកម្ម</Text>
          </Timeline.Item>
          <Timeline.Item color="blue">
            <Text>កំពុងដំណើរការ</Text>
          </Timeline.Item>
          <Timeline.Item color="gray">
            <Text type="secondary">រង់ចាំការវាយតម្លៃ</Text>
          </Timeline.Item>
        </Timeline>
      )
    },
    {
      id: 'improvement',
      title: 'ផែនការកែលម្អ',
      description: 'បង្កើតផែនការកែលម្អសម្រាប់គ្រូបង្រៀន',
      duration: '៣ នាទី',
      steps: [
        'វិភាគលទ្ធផលសង្កេត',
        'កំណត់ចំណុចដែលត្រូវកែលម្អ',
        'បង្កើតសកម្មភាពជាក់លាក់',
        'កំណត់ពេលវេលា',
        'តាមដាននិងវាយតម្លៃ'
      ],
      preview: (
        <List
          size="small"
          dataSource={[
            { title: 'ការរៀបចំមេរៀន', status: 'done' },
            { title: 'បច្ចេកទេសបង្រៀន', status: 'progress' },
            { title: 'ការវាយតម្លៃសិស្ស', status: 'todo' }
          ]}
          renderItem={item => (
            <List.Item>
              <Badge
                status={
                  item.status === 'done' ? 'success' : 
                  item.status === 'progress' ? 'processing' : 'default'
                }
                text={item.title}
              />
            </List.Item>
          )}
        />
      )
    }
  ];

  const handleDemoClick = (demoId: string) => {
    setActiveDemo(demoId);
    setModalVisible(true);
  };

  const getActiveDemo = () => {
    return demoFeatures.find(demo => demo.id === activeDemo);
  };

  return (
    <>
      <Title level={3} style={{ marginBottom: 24 }}>សាកល្បងមុខងារជាក់ស្តែង</Title>
      <Row gutter={[16, 16]}>
        {demoFeatures.map(demo => (
          <Col xs={24} sm={12} lg={6} key={demo.id}>
            <Card
              hoverable
              actions={[
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleDemoClick(demo.id)}
                >
                  មើលការបង្ហាញ
                </Button>
              ]}
            >
              <Card.Meta
                avatar={
                  <Avatar 
                    size={48} 
                    style={{ backgroundColor: '#1890ff' }}
                    icon={
                      demo.id === 'observation' ? <EyeOutlined /> :
                      demo.id === 'analytics' ? <BarChartOutlined /> :
                      demo.id === 'mission' ? <FileTextOutlined /> :
                      <EditOutlined />
                    }
                  />
                }
                title={demo.title}
                description={
                  <>
                    <Paragraph ellipsis={{ rows: 2 }}>
                      {demo.description}
                    </Paragraph>
                    <Tag icon={<ClockCircleOutlined />}>{demo.duration}</Tag>
                  </>
                }
              />
              {demo.preview && (
                <>
                  <Divider />
                  {demo.preview}
                </>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={getActiveDemo()?.title}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            បិទ
          </Button>,
          <Button key="try" type="primary" icon={<PlayCircleOutlined />}>
            សាកល្បងដោយខ្លួនឯង
          </Button>
        ]}
      >
        {getActiveDemo() && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              message="ការបង្ហាញជាក់ស្តែង"
              description={getActiveDemo().description}
              type="info"
              showIcon
            />
            
            <Card title="ជំហានដំណើរការ">
              <Timeline>
                {getActiveDemo().steps.map((step, index) => (
                  <Timeline.Item 
                    key={index}
                    dot={<CheckCircleOutlined style={{ fontSize: '16px' }} />}
                    color="green"
                  >
                    <Text>{step}</Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>

            <Card 
              title="ការបង្ហាញផ្ទាល់" 
              style={{ background: '#fafafa' }}
              bodyStyle={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Space direction="vertical" align="center">
                <PlayCircleOutlined style={{ fontSize: 64, color: '#1890ff' }} />
                <Text type="secondary">វីដេអូបង្ហាញនឹងបង្ហាញនៅទីនេះ</Text>
                <Button type="primary">ចាប់ផ្តើមមើល</Button>
              </Space>
            </Card>

            <Card title="គុណសម្បត្តិសំខាន់ៗ">
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic
                    title="ងាយស្រួលប្រើ"
                    value={95}
                    suffix="%"
                    prefix={<SmileOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="សន្សំពេលវេលា"
                    value={70}
                    suffix="%"
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="ភាពត្រឹមត្រូវ"
                    value={99}
                    suffix="%"
                    prefix={<SafetyOutlined />}
                  />
                </Col>
              </Row>
            </Card>
          </Space>
        )}
      </Modal>
    </>
  );
};

export default InteractiveDemo;
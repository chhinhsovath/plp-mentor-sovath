import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Row, Col, Tag, Space, List, Avatar } from 'antd';
import { FormOutlined, BookOutlined, CalculatorOutlined, ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  grade: string;
  levels: string[];
  totalQuestions: number;
  sections: { name: string; count: number }[];
  status: 'available' | 'implemented';
}

const FormBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

  const formTemplates: FormTemplate[] = [
    {
      id: 'kh_g1',
      name: 'ភាសាខ្មែរ ថ្នាក់ទី១',
      description: 'ទម្រង់វាយតម្លៃសម្រាប់ភាសាខ្មែរ ថ្នាក់ទី១ (៣ កម្រិត)',
      subject: 'KH',
      grade: 'G1',
      levels: ['LEVEL-1', 'LEVEL-2', 'LEVEL-3'],
      totalQuestions: 45,
      sections: [
        { name: 'កម្រិតទី១', count: 28 },
        { name: 'កម្រិតទី២', count: 13 },
        { name: 'កម្រិតទី៣', count: 4 }
      ],
      status: 'implemented'
    },
    {
      id: 'kh_g2',
      name: 'ភាសាខ្មែរ ថ្នាក់ទី២',
      description: 'ទម្រង់វាយតម្លៃសម្រាប់ភាសាខ្មែរ ថ្នាក់ទី២ (៣ កម្រិត)',
      subject: 'KH',
      grade: 'G2',
      levels: ['LEVEL-1', 'LEVEL-2', 'LEVEL-3'],
      totalQuestions: 43,
      sections: [
        { name: 'កម្រិតទី១', count: 26 },
        { name: 'កម្រិតទី២', count: 13 },
        { name: 'កម្រិតទី៣', count: 4 }
      ],
      status: 'implemented'
    },
    {
      id: 'kh_g3',
      name: 'ភាសាខ្មែរ ថ្នាក់ទី៣',
      description: 'ទម្រង់វាយតម្លៃសម្រាប់ភាសាខ្មែរ ថ្នាក់ទី៣ (៣ កម្រិត)',
      subject: 'KH',
      grade: 'G3',
      levels: ['LEVEL-1', 'LEVEL-2', 'LEVEL-3'],
      totalQuestions: 16,
      sections: [
        { name: 'កម្រិតទី១', count: 3 },
        { name: 'កម្រិតទី២', count: 6 },
        { name: 'កម្រិតទី៣', count: 7 }
      ],
      status: 'implemented'
    },
    {
      id: 'math_all',
      name: 'គណិតវិទ្យា (ថ្នាក់ទី១-៣)',
      description: 'ទម្រង់វាយតម្លៃសម្រាប់គណិតវិទ្យា ថ្នាក់ទី១ ទី២ និងទី៣ (៣ កម្រិត)',
      subject: 'MATH',
      grade: 'G1,G2,G3',
      levels: ['LEVEL-1', 'LEVEL-2', 'LEVEL-3'],
      totalQuestions: 27,
      sections: [
        { name: 'កម្រិតទី១', count: 9 },
        { name: 'កម្រិតទី២', count: 9 },
        { name: 'កម្រិតទី៣', count: 9 }
      ],
      status: 'implemented'
    }
  ];

  const handleImplementTemplate = (template: FormTemplate) => {
    // For now, just show implementation details
    setSelectedTemplate(template);
  };

  const getSubjectIcon = (subject: string) => {
    return subject === 'KH' ? <BookOutlined /> : <CalculatorOutlined />;
  };

  const getSubjectColor = (subject: string) => {
    return subject === 'KH' ? '#1890ff' : '#52c41a';
  };

  if (selectedTemplate) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => setSelectedTemplate(null)}
              >
                ត្រឡប់ក្រោយ
              </Button>
              <Title level={2} style={{ margin: 0 }}>
                {selectedTemplate.name}
              </Title>
              <Tag color={selectedTemplate.status === 'implemented' ? 'success' : 'processing'}>
                {selectedTemplate.status === 'implemented' ? 'បានអនុវត្តរួច' : 'អាចអនុវត្តបាន'}
              </Tag>
            </div>

            <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
              <Text>{selectedTemplate.description}</Text>
            </div>

            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: getSubjectColor(selectedTemplate.subject) }}>
                      {selectedTemplate.totalQuestions}
                    </div>
                    <div>សំណួរសរុប</div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                      {selectedTemplate.levels.length}
                    </div>
                    <div>កម្រិត</div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                      {selectedTemplate.sections.length}
                    </div>
                    <div>ផ្នែក</div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Card title="រចនាសម្ព័នធទម្រង់" size="small">
              <List
                dataSource={selectedTemplate.sections}
                renderItem={(section, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar style={{ backgroundColor: getSubjectColor(selectedTemplate.subject) }}>
                        {index + 1}
                      </Avatar>}
                      title={section.name}
                      description={`${section.count} សំណួរ`}
                    />
                  </List.Item>
                )}
              />
            </Card>

            <div style={{ textAlign: 'center' }}>
              {selectedTemplate.status === 'implemented' ? (
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<EyeOutlined />}
                  onClick={() => navigate('/forms')}
                >
                  មើលទម្រង់ដែលបានបង្កើត
                </Button>
              ) : (
                <Button type="primary" size="large" disabled>
                  នឹងអនុវត្តឆាប់ៗនេះ
                </Button>
              )}
            </div>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>
              បង្កើតទម្រង់វាយតម្លៃ
            </Title>
            <Text type="secondary">
              ជ្រើសរើសគំរូទម្រង់ដែលអ្នកចង់អនុវត្ត
            </Text>
          </div>

          <Row gutter={[16, 16]}>
            {formTemplates.map((template) => (
              <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
                <Card
                  hoverable
                  onClick={() => handleImplementTemplate(template)}
                  style={{ 
                    height: '100%',
                    border: template.status === 'implemented' ? '2px solid #52c41a' : undefined
                  }}
                  actions={[
                    <Button 
                      type="text" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImplementTemplate(template);
                      }}
                    >
                      {template.status === 'implemented' ? 'មើល' : 'អនុវត្ត'}
                    </Button>
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <Avatar 
                        size={48}
                        style={{ backgroundColor: getSubjectColor(template.subject) }}
                        icon={getSubjectIcon(template.subject)}
                      />
                    }
                    title={template.name}
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text ellipsis={{ rows: 2 }}>{template.description}</Text>
                        <div>
                          <Tag color={getSubjectColor(template.subject)}>
                            {template.subject === 'KH' ? 'ភាសាខ្មែរ' : 'គណិតវិទ្យា'}
                          </Tag>
                          <Tag>{template.totalQuestions} សំណួរ</Tag>
                        </div>
                        <Tag color={template.status === 'implemented' ? 'success' : 'processing'}>
                          {template.status === 'implemented' ? 'បានអនុវត្ត' : 'អាចអនុវត្ត'}
                        </Tag>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Space>
      </Card>
    </div>
  );
};

export default FormBuilderPage;
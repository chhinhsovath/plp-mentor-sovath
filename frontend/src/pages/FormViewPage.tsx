import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Space, Radio, Form, Divider, Tag, Row, Col, Spin, Empty, message, Select, Alert } from 'antd';
import { ArrowLeftOutlined, EditOutlined, SaveOutlined, FilePdfOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { generateFormsFromCSV } from '../data/generateFormsFromCSV';
import { allFormsData } from '../data/allFormsData';
import { FormTemplate } from '../types/form';

const { Title, Text } = Typography;
const { Option } = Select;

const FormViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [completedLevels, setCompletedLevels] = useState<string[]>([]);

  useEffect(() => {
    loadForm();
  }, [id]);

  const loadForm = () => {
    try {
      setLoading(true);
      const generatedForms = generateFormsFromCSV(allFormsData);
      const foundForm = generatedForms.find(f => f.id === id);
      if (foundForm) {
        setFormTemplate(foundForm);
      }
    } catch (error) {
      console.error('Error loading form:', error);
      message.error('មានបញ្ហាក្នុងការទាញយកទម្រង់');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (selectedLevels.length === 0) {
      message.warning('សូមជ្រើសរើសយ៉ាងហោចណាស់កម្រិតមួយមុនពេលរក្សាទុក');
      return;
    }
    
    setSaving(true);
    try {
      console.log('Form values for levels:', selectedLevels, values);
      const levelNames = selectedLevels.map(levelId => 
        formTemplate?.sections.find(s => s.id === levelId)?.title || levelId
      ).join(', ');
      
      message.success(`បានរក្សាទុកការវាយតម្លៃ ${levelNames} ដោយជោគជ័យ`);
      
      // Mark these levels as completed
      const newCompletedLevels = [...new Set([...completedLevels, ...selectedLevels])];
      setCompletedLevels(newCompletedLevels);
      
      // Clear form and selection
      form.resetFields();
      setSelectedLevels([]);
      
      // Here you would typically save to backend
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការរក្សាទុក');
    } finally {
      setSaving(false);
    }
  };

  const handleLevelChange = (values: string[]) => {
    if (form.isFieldsTouched() && selectedLevels.length > 0) {
      message.warning('អ្នកមានការផ្លាស់ប្តូរដែលមិនទាន់រក្សាទុក។ សូមរក្សាទុកមុនពេលប្តូរកម្រិត។');
      return;
    }
    setSelectedLevels(values);
    form.resetFields();
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!formTemplate) {
    return (
      <div style={{ padding: '24px' }}>
        <Empty
          description="រកមិនឃើញទម្រង់វាយតម្លៃ"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button onClick={() => navigate('/forms')}>
            ត្រឡប់ទៅកាន់បញ្ជីទម្រង់
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/forms')}
              >
                ត្រឡប់
              </Button>
              <Title level={2} style={{ margin: 0 }}>
                {formTemplate.name}
              </Title>
            </Space>
            <Space>
              <Button icon={<EditOutlined />} onClick={() => navigate(`/forms/${id}/edit`)}>
                កែសម្រួល
              </Button>
              <Button icon={<FilePdfOutlined />}>
                នាំចេញ PDF
              </Button>
            </Space>
          </div>

          <Card type="inner" style={{ backgroundColor: '#f0f2f5' }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Text>{formTemplate.description}</Text>
              </Col>
              <Col span={24}>
                <Space wrap>
                  <Tag color="blue">ថ្នាក់៖ {formTemplate.targetGrades?.join(', ')}</Tag>
                  <Tag color="green">មុខវិជ្ជា៖ {formTemplate.targetSubjects?.join(', ')}</Tag>
                  <Tag color="purple">កម្រិត៖ {formTemplate.sections.length}</Tag>
                  <Tag color="orange">សំណួរសរុប៖ {formTemplate.sections.reduce((sum, s) => sum + s.fields.length, 0)}</Tag>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Level Selection */}
          <Card type="inner">
            <Row gutter={[16, 16]} align="middle">
              <Col span={24}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Title level={4}>ជ្រើសរើសកម្រិតសម្រាប់វាយតម្លៃ (អាចជ្រើសរើសច្រើនកម្រិត)</Title>
                  <Select
                    mode="multiple"
                    placeholder="សូមជ្រើសរើសកម្រិតមួយ ឬច្រើន"
                    style={{ width: '100%' }}
                    size="large"
                    value={selectedLevels}
                    onChange={handleLevelChange}
                    allowClear
                  >
                    {formTemplate.sections.map((section) => (
                      <Option key={section.id} value={section.id}>
                        <Space>
                          {section.title}
                          <Tag color="blue">{section.fields.length} សំណួរ</Tag>
                          {completedLevels.includes(section.id) && (
                            <Tag color="success" icon={<CheckCircleOutlined />}>
                              បានបញ្ចប់
                            </Tag>
                          )}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                  
                  {/* Progress Status */}
                  {completedLevels.length > 0 && (
                    <Alert
                      message={`កម្រិតដែលបានបញ្ចប់៖ ${completedLevels.length}/${formTemplate.sections.length}`}
                      type="info"
                      showIcon
                    />
                  )}
                  
                  {/* Selected levels info */}
                  {selectedLevels.length > 0 && (
                    <Alert
                      message={`កម្រិតដែលបានជ្រើសរើស៖ ${selectedLevels.length} កម្រិត`}
                      description={`សំណួរសរុប៖ ${formTemplate.sections
                        .filter(s => selectedLevels.includes(s.id))
                        .reduce((sum, s) => sum + s.fields.length, 0)} សំណួរ`}
                      type="success"
                      showIcon
                    />
                  )}
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Form Questions - Show all selected levels */}
          {selectedLevels.length > 0 && (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              {formTemplate.sections
                .filter(section => selectedLevels.includes(section.id))
                .map((section, sectionIndex) => (
                  <Card 
                    key={section.id} 
                    type="inner" 
                    title={
                      <Space>
                        <Tag color="blue">{section.title}</Tag>
                        <Text type="secondary">({section.fields.length} សំណួរ)</Text>
                      </Space>
                    }
                    style={{ marginBottom: 16 }}
                  >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {section.fields.map((field, fieldIndex) => (
                        <div key={field.id}>
                      <Form.Item
                        name={field.name}
                        label={
                          <Space direction="vertical" size="small">
                            <Text strong>{fieldIndex + 1}. {field.label}</Text>
                            {field.description && (
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {field.description}
                              </Text>
                            )}
                          </Space>
                        }
                        rules={[
                          {
                            required: field.validation?.required,
                            message: 'សូមជ្រើសរើសចម្លើយ'
                          }
                        ]}
                      >
                        {field.type === 'radio' && field.options ? (
                          <Radio.Group>
                            <Space direction="vertical">
                              {field.options.map((option) => (
                                <Radio key={option.value} value={option.value}>
                                  {option.label}
                                </Radio>
                              ))}
                            </Space>
                          </Radio.Group>
                        ) : (
                          <Text type="secondary">Field type not supported</Text>
                        )}
                      </Form.Item>
                          {fieldIndex < section.fields.length - 1 && <Divider style={{ margin: '16px 0' }} />}
                        </div>
                      ))}
                    </Space>
                  </Card>
                ))}

              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={saving}
                  icon={<SaveOutlined />}
                >
                  រក្សាទុកការវាយតម្លៃ
                </Button>
              </div>
            </Form>
          )}

          {/* Message when no level is selected */}
          {selectedLevels.length === 0 && (
            <Card type="inner" style={{ textAlign: 'center', padding: '48px' }}>
              <Empty
                description={
                  <Space direction="vertical" size="small">
                    <Text style={{ fontSize: '16px' }}>សូមជ្រើសរើសកម្រិតដើម្បីចាប់ផ្តើមវាយតម្លៃ</Text>
                    <Text type="secondary">អ្នកអាចជ្រើសរើសកម្រិតមួយ ឬច្រើនតាមតម្រូវការ</Text>
                  </Space>
                }
              />
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default FormViewPage;
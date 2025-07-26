import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber, 
  Checkbox, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Row, 
  Col, 
  Divider, 
  message,
  Result,
  Statistic,
  Alert,
  Table
} from 'antd';
import { CheckCircleOutlined, CalculatorOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Geographic data
const geoData = {
  'banteay-meanchey': {
    name: 'បន្ទាយមានជ័យ',
    districts: {
      'mongkol-borei': {
        name: 'មង្គលបូរី',
        communes: {
          'banteay-neang': {
            name: 'បន្ទាយនាង',
            villages: ['អូរធំ', 'ភ្នំ', 'បន្ទាយនាង', 'គោកព្នៅ', 'ត្រាង']
          },
          'bat-trang': {
            name: 'បត់ត្រង់',
            villages: ['ខ្ទុម្ពរាយលិច', 'ខ្ទុម្ពរាយកើត', 'អន្លង់ថ្ងាន់កើត']
          }
        }
      },
      'thma-puok': {
        name: 'ថ្មពួក',
        communes: {
          'thma-puok': {
            name: 'ថ្មពួក',
            villages: ['ថ្មពួក', 'ព្រៃល្វា', 'បឹងជាំ']
          }
        }
      }
    }
  },
  'battambang': {
    name: 'បាត់ដំបង',
    districts: {
      'battambang': {
        name: 'បាត់ដំបង',
        communes: {
          'svay-por': {
            name: 'ស្វាយប៉ោ',
            villages: ['ស្វាយប៉ោ', 'តាប៉ុន', 'ព្រែកមហាថោង']
          }
        }
      }
    }
  },
  'pailin': {
    name: 'ប៉ៃលិន',
    districts: {
      'pailin': {
        name: 'ប៉ៃលិន',
        communes: {
          'pailin': {
            name: 'ប៉ៃលិន',
            villages: ['ប៉ៃលិន', 'អូរតាវ៉ាវ', 'ទួលល្វា']
          }
        }
      }
    }
  },
  'oddar-meanchey': {
    name: 'ឧត្តរមានជ័យ',
    districts: {
      'anlong-veng': {
        name: 'អន្លង់វែង',
        communes: {
          'anlong-veng': {
            name: 'អន្លង់វែង',
            villages: ['អន្លង់វែង', 'ត្រពាំងប្រីយ៍', 'លំទង']
          }
        }
      }
    }
  },
  'preah-vihear': {
    name: 'ព្រះវិហារ',
    districts: {
      'chey-saen': {
        name: 'ជ័យសែន',
        communes: {
          'chey-saen': {
            name: 'ជ័យសែន',
            villages: ['ជ័យសែន', 'ព្រៃមាស', 'តាមាវ']
          }
        }
      }
    }
  },
  'stung-treng': {
    name: 'ស្ទឹងត្រែង',
    districts: {
      'stung-treng': {
        name: 'ស្ទឹងត្រែង',
        communes: {
          'stung-treng': {
            name: 'ស្ទឹងត្រែង',
            villages: ['ស្ទឹងត្រែង', 'ព្រែកក្រសាំង', 'សំបូរ']
          }
        }
      }
    }
  },
  'ratanakiri': {
    name: 'រតនគិរី',
    districts: {
      'banlung': {
        name: 'បានលុង',
        communes: {
          'banlung': {
            name: 'បានលុង',
            villages: ['បានលុង', 'លាបានសៀក', 'យ៉ាកឡោម']
          }
        }
      }
    }
  },
  'mondulkiri': {
    name: 'មណ្ឌលគិរី',
    districts: {
      'senmonorom': {
        name: 'សែនមនោរម្យ',
        communes: {
          'senmonorom': {
            name: 'សែនមនោរម្យ',
            villages: ['សែនមនោរម្យ', 'ស្ពានមាន', 'សុខដុម']
          }
        }
      }
    }
  }
};

// Grade options by school type
const gradeOptions = {
  'primary': {
    name: 'បឋមសិក្សា',
    grades: ['ថ្នាក់ទី១', 'ថ្នាក់ទី២', 'ថ្នាក់ទី៣', 'ថ្នាក់ទី៤', 'ថ្នាក់ទី៥', 'ថ្នាក់ទី៦']
  },
  'lower-secondary': {
    name: 'មធ្យមសិក្សាបឋមភូមិ',
    grades: ['ថ្នាក់ទី៧', 'ថ្នាក់ទី៨', 'ថ្នាក់ទី៩']
  },
  'upper-secondary': {
    name: 'មធ្យមសិក្សាទុតិយភូមិ',
    grades: ['ថ្នាក់ទី១០', 'ថ្នាក់ទី១១', 'ថ្នាក់ទី១២']
  },
  'high-school': {
    name: 'វិទ្យាល័យ',
    grades: ['ថ្នាក់ទី៧', 'ថ្នាក់ទី៨', 'ថ្នាក់ទី៩', 'ថ្នាក់ទី១០', 'ថ្នាក់ទី១១', 'ថ្នាក់ទី១២']
  },
  'technical': {
    name: 'សាលាបច្ចេកទេស',
    grades: ['ឆ្នាំទី១', 'ឆ្នាំទី២', 'ឆ្នាំទី៣']
  },
  'university': {
    name: 'សាកលវិទ្យាល័យ',
    grades: ['ឆ្នាំទី១', 'ឆ្នាំទី២', 'ឆ្នាំទី៣', 'ឆ្នាំទី៤']
  },
  'pagoda': {
    name: 'សាលាវត្ត',
    grades: ['កម្រិតដំបូង', 'កម្រិតមធ្យម', 'កម្រិតខ្ពស់']
  }
};

interface GradeData {
  grade: string;
  totalStudents: number;
  affectedStudents: number;
}

const PublicImpactAssessmentForm: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedCommune, setSelectedCommune] = useState<string>('');
  const [selectedSchoolType, setSelectedSchoolType] = useState<string>('');
  const [gradeData, setGradeData] = useState<GradeData[]>([]);
  const [totals, setTotals] = useState({
    totalStudents: 0,
    totalAffected: 0,
    percentage: 0
  });

  // Calculate totals whenever grade data changes
  useEffect(() => {
    const total = gradeData.reduce((sum, grade) => sum + (grade.totalStudents || 0), 0);
    const affected = gradeData.reduce((sum, grade) => sum + (grade.affectedStudents || 0), 0);
    const percentage = total > 0 ? Math.round((affected / total) * 100) : 0;
    
    setTotals({
      totalStudents: total,
      totalAffected: affected,
      percentage
    });
  }, [gradeData]);

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    setSelectedDistrict('');
    setSelectedCommune('');
    form.setFieldsValue({ district: undefined, commune: undefined, village: undefined });
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setSelectedCommune('');
    form.setFieldsValue({ commune: undefined, village: undefined });
  };

  const handleCommuneChange = (value: string) => {
    setSelectedCommune(value);
    form.setFieldsValue({ village: undefined });
  };

  const handleSchoolTypeChange = (value: string) => {
    setSelectedSchoolType(value);
    // Initialize grade data for the selected school type
    if (gradeOptions[value]) {
      const initialGradeData = gradeOptions[value].grades.map(grade => ({
        grade,
        totalStudents: 0,
        affectedStudents: 0
      }));
      setGradeData(initialGradeData);
    } else {
      setGradeData([]);
    }
  };

  const updateGradeData = (index: number, field: 'totalStudents' | 'affectedStudents', value: number) => {
    const newGradeData = [...gradeData];
    newGradeData[index] = {
      ...newGradeData[index],
      [field]: value || 0
    };
    setGradeData(newGradeData);
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // Prepare submission data
      const submissionData = {
        ...values,
        gradeData: gradeData.filter(g => g.totalStudents > 0),
        totals,
        submittedAt: new Date().toISOString(),
        // Generate a unique submission ID
        id: `IA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      // In a real application, this would be an API call
      // For now, we'll simulate saving to localStorage
      const existingSubmissions = JSON.parse(localStorage.getItem('impactAssessments') || '[]');
      existingSubmissions.push(submissionData);
      localStorage.setItem('impactAssessments', JSON.stringify(existingSubmissions));

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSubmissionId(submissionData.id);
      setSubmitted(true);
      message.success('របាយការណ៍ត្រូវបានបញ្ជូនដោយជោគជ័យ!');
    } catch (error) {
      message.error('មានកំហុសក្នុងការបញ្ជូនរបាយការណ៍។ សូមព្យាយាមម្តងទៀត។');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 800, margin: '50px auto', padding: 20 }}>
        <Result
          status="success"
          title="របាយការណ៍ត្រូវបានបញ្ជូនដោយជោគជ័យ!"
          subTitle={
            <Space direction="vertical" align="center">
              <Text>សូមអរគុណសម្រាប់ការចូលរួមចំណែករបស់អ្នក។</Text>
              {submissionId && (
                <Text type="secondary">លេខសម្គាល់របាយការណ៍: {submissionId}</Text>
              )}
            </Space>
          }
          extra={[
            <Button key="new" type="primary" onClick={() => window.location.reload()}>
              បញ្ជូនរបាយការណ៍ថ្មី
            </Button>,
            <Button key="home" onClick={() => navigate('/')}>
              ទំព័រដើម
            </Button>
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '20px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        <Card style={{ marginBottom: 20 }}>
          <Title level={2} style={{ textAlign: 'center', color: '#003d7a' }}>
            ប្រព័ន្ធវាយតម្លៃផលប៉ះពាល់អប់រំពីជម្លោះព្រំដែន
          </Title>
          <Paragraph style={{ textAlign: 'center', fontSize: 16 }}>
            ទម្រង់បញ្ជូលទិន្នន័យសម្រាប់សាលារៀនតាមបណ្តោយព្រំដែនកម្ពុជា-ថៃ
          </Paragraph>
        </Card>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
        >
          {/* Basic School Information */}
          <Card title="ព័ត៌មានមូលដ្ឋានរបស់សាលា" style={{ marginBottom: 20 }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ឈ្មោះសាលា"
                  name="schoolName"
                  rules={[{ required: true, message: 'សូមបញ្ចូលឈ្មោះសាលា' }]}
                >
                  <Input placeholder="ឈ្មោះសាលា" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ប្រភេទសាលា"
                  name="schoolType"
                  rules={[{ required: true, message: 'សូមជ្រើសរើសប្រភេទសាលា' }]}
                >
                  <Select 
                    placeholder="ជ្រើសរើសប្រភេទសាលា"
                    onChange={handleSchoolTypeChange}
                  >
                    <Option value="primary">សាលាបឋមសិក្សា</Option>
                    <Option value="lower-secondary">សាលាមធ្យមសិក្សាបឋមភូមិ</Option>
                    <Option value="upper-secondary">សាលាមធ្យមសិក្សាទុតិយភូមិ</Option>
                    <Option value="high-school">វិទ្យាល័យ</Option>
                    <Option value="technical">សាលាបច្ចេកទេស</Option>
                    <Option value="university">សាកលវិទ្យាល័យ</Option>
                    <Option value="pagoda">សាលាវត្ត</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={6}>
                <Form.Item
                  label="ខេត្ត"
                  name="province"
                  rules={[{ required: true, message: 'សូមជ្រើសរើសខេត្ត' }]}
                >
                  <Select 
                    placeholder="ជ្រើសរើសខេត្ត"
                    onChange={handleProvinceChange}
                  >
                    {Object.entries(geoData).map(([key, data]) => (
                      <Option key={key} value={key}>{data.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  label="ស្រុក/ក្រុង"
                  name="district"
                  rules={[{ required: true, message: 'សូមជ្រើសរើសស្រុក/ក្រុង' }]}
                >
                  <Select 
                    placeholder="ជ្រើសរើសស្រុក/ក្រុង"
                    disabled={!selectedProvince}
                    onChange={handleDistrictChange}
                  >
                    {selectedProvince && Object.entries(geoData[selectedProvince].districts).map(([key, data]) => (
                      <Option key={key} value={key}>{data.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  label="ឃុំ/សង្កាត់"
                  name="commune"
                  rules={[{ required: true, message: 'សូមជ្រើសរើសឃុំ/សង្កាត់' }]}
                >
                  <Select 
                    placeholder="ជ្រើសរើសឃុំ/សង្កាត់"
                    disabled={!selectedDistrict}
                    onChange={handleCommuneChange}
                  >
                    {selectedProvince && selectedDistrict && 
                      Object.entries(geoData[selectedProvince].districts[selectedDistrict].communes).map(([key, data]) => (
                        <Option key={key} value={key}>{data.name}</Option>
                      ))
                    }
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  label="ភូមិ"
                  name="village"
                  rules={[{ required: true, message: 'សូមជ្រើសរើសភូមិ' }]}
                >
                  <Select 
                    placeholder="ជ្រើសរើសភូមិ"
                    disabled={!selectedCommune}
                  >
                    {selectedProvince && selectedDistrict && selectedCommune && 
                      geoData[selectedProvince].districts[selectedDistrict].communes[selectedCommune].villages.map(village => (
                        <Option key={village} value={village}>{village}</Option>
                      ))
                    }
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Grade Level Information */}
          {selectedSchoolType && (
            <Card 
              title="ព័ត៌មានសិស្សតាមថ្នាក់" 
              style={{ marginBottom: 20 }}
              extra={
                <Space>
                  <Statistic 
                    title="សិស្សសរុប" 
                    value={totals.totalStudents} 
                    style={{ marginRight: 20 }}
                  />
                  <Statistic 
                    title="រងផលប៉ះពាល់" 
                    value={totals.totalAffected} 
                    valueStyle={{ color: '#cf1322' }}
                    style={{ marginRight: 20 }}
                  />
                  <Statistic 
                    title="ភាគរយ" 
                    value={totals.percentage} 
                    suffix="%" 
                    valueStyle={{ color: totals.percentage > 50 ? '#cf1322' : '#3f8600' }}
                  />
                </Space>
              }
            >
              <Alert
                message="សូមបញ្ចូលចំនួនសិស្សសរុប និងចំនួនសិស្សរងផលប៉ះពាល់សម្រាប់ថ្នាក់នីមួយៗ"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Table
                dataSource={gradeData}
                pagination={false}
                rowKey="grade"
              >
                <Table.Column title="ថ្នាក់" dataIndex="grade" key="grade" />
                <Table.Column 
                  title="ចំនួនសិស្សសរុប" 
                  dataIndex="totalStudents" 
                  key="totalStudents"
                  render={(value, record, index) => (
                    <InputNumber
                      min={0}
                      value={value}
                      onChange={(val) => updateGradeData(index, 'totalStudents', val || 0)}
                      style={{ width: '100%' }}
                    />
                  )}
                />
                <Table.Column 
                  title="ចំនួនសិស្សរងផលប៉ះពាល់" 
                  dataIndex="affectedStudents" 
                  key="affectedStudents"
                  render={(value, record, index) => (
                    <InputNumber
                      min={0}
                      max={gradeData[index].totalStudents}
                      value={value}
                      onChange={(val) => updateGradeData(index, 'affectedStudents', val || 0)}
                      style={{ width: '100%' }}
                    />
                  )}
                />
                <Table.Column 
                  title="ភាគរយ" 
                  key="percentage"
                  render={(_, record: GradeData) => {
                    const percentage = record.totalStudents > 0 
                      ? Math.round((record.affectedStudents / record.totalStudents) * 100) 
                      : 0;
                    return <span>{percentage}%</span>;
                  }}
                />
              </Table>
            </Card>
          )}

          {/* Impact Assessment */}
          <Card title="ការវាយតម្លៃផលប៉ះពាល់" style={{ marginBottom: 20 }}>
            <Form.Item
              label="ប្រភេទផលប៉ះពាល់"
              name="impactTypes"
              rules={[{ required: true, message: 'សូមជ្រើសរើសយ៉ាងហោចណាស់ប្រភេទមួយ' }]}
            >
              <Checkbox.Group style={{ width: '100%' }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8}>
                    <Checkbox value="school-closure">សាលាបិទទ្វារ</Checkbox>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Checkbox value="student-evacuation">សិស្សជម្លៀស</Checkbox>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Checkbox value="teacher-absence">គ្រូអវត្តមាន</Checkbox>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Checkbox value="infrastructure-damage">ហេដ្ឋារចនាសម្ព័ន្ធខូចខាត</Checkbox>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Checkbox value="learning-disruption">ការរំខានដល់ការសិក្សា</Checkbox>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Checkbox value="psychological-impact">ផលប៉ះពាល់ផ្លូវចិត្ត</Checkbox>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Checkbox value="material-shortage">កង្វះសម្ភារៈសិក្សា</Checkbox>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Checkbox value="other">ផ្សេងៗ</Checkbox>
                  </Col>
                </Row>
              </Checkbox.Group>
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="កម្រិតធ្ងន់ធ្ងរ"
                  name="severity"
                  rules={[{ required: true, message: 'សូមជ្រើសរើសកម្រិតធ្ងន់ធ្ងរ' }]}
                >
                  <Select placeholder="ជ្រើសរើសកម្រិត">
                    <Option value={1}>១ - តិចតួចបំផុត</Option>
                    <Option value={2}>២ - តិចតួច</Option>
                    <Option value={3}>៣ - មធ្យម</Option>
                    <Option value={4}>៤ - ធ្ងន់ធ្ងរ</Option>
                    <Option value={5}>៥ - ធ្ងន់ធ្ងរបំផុត</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="កាលបរិច្ឆេទកើតហេតុ"
                  name="incidentDate"
                  rules={[{ required: true, message: 'សូមជ្រើសរើសកាលបរិច្ឆេទ' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="រយៈពេល (ថ្ងៃ)"
                  name="duration"
                >
                  <InputNumber min={1} style={{ width: '100%' }} placeholder="ចំនួនថ្ងៃ" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="គ្រូបង្រៀនរងផលប៉ះពាល់"
                  name="teacherAffected"
                >
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="ចំនួនគ្រូ" />
                </Form.Item>
              </Col>
              <Col xs={24} md={16}>
                <Form.Item
                  label="ព័ត៌មានទំនាក់ទំនង"
                  name="contactInfo"
                >
                  <Input placeholder="លេខទូរស័ព្ទ ឬ អ៊ីមែល (ស្រេចចិត្ត)" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="ពិពណ៌នាលម្អិត"
              name="description"
            >
              <TextArea 
                rows={4} 
                placeholder="សូមពិពណ៌នាអំពីស្ថានភាពនិងផលប៉ះពាល់លម្អិត..."
              />
            </Form.Item>
          </Card>

          <Form.Item>
            <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large" 
                loading={loading}
                icon={<CheckCircleOutlined />}
              >
                បញ្ជូនរបាយការណ៍
              </Button>
              <Button 
                size="large" 
                onClick={() => form.resetFields()}
              >
                សម្អាតទម្រង់
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default PublicImpactAssessmentForm;
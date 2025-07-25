import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Space, List, Tag, Input, Select, Spin, Empty } from 'antd';
import { FormOutlined, PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { generateFormsFromCSV } from '../data/generateFormsFromCSV';
import { allFormsData } from '../data/allFormsData';
import { FormTemplate } from '../types/form';
import { formService } from '../services/form.service';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const FormsPageWithData: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      // ALWAYS use generated forms from CSV data (our newly created forms)
      const generatedForms = generateFormsFromCSV(allFormsData);
      console.log('Generated forms from CSV:', generatedForms);
      setForms(generatedForms || []);
    } catch (error) {
      console.error('Error generating forms:', error);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredForms = forms.filter(form => {
    if (!form) return false;
    
    const matchesSearch = (form.name && form.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGrade = selectedGrade === 'all' || 
                        (form.targetGrades && form.targetGrades.some(grade => grade === selectedGrade));
    const matchesSubject = selectedSubject === 'all' || 
                          (form.targetSubjects && form.targetSubjects.some(subject => subject === selectedSubject));
    
    return matchesSearch && matchesGrade && matchesSubject;
  });

  const getFormStats = (form: FormTemplate) => {
    if (!form || !form.sections) {
      return {
        sections: 0,
        fields: 0
      };
    }
    const totalFields = form.sections.reduce((sum, section) => {
      if (!section || !section.fields) return sum;
      return sum + section.fields.length;
    }, 0);
    return {
      sections: form.sections.length,
      fields: totalFields
    };
  };

  const getGradeDisplay = (grades: string[] | undefined) => {
    if (!grades || grades.length === 0) return '';
    return grades.map(g => `ថ្នាក់ទី${g.replace('G', '')}`).join(', ');
  };

  const getSubjectDisplay = (subjects: string[] | undefined) => {
    if (!subjects || subjects.length === 0) return '';
    const subjectMap: Record<string, string> = {
      'KH': 'ភាសាខ្មែរ',
      'MATH': 'គណិតវិទ្យា'
    };
    return subjects.map(s => subjectMap[s] || s).join(', ');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2}>
              {t('forms.title') || 'ទម្រង់វាយតម្លៃ'}
            </Title>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/forms/new')}
            >
              {t('forms.create')}
            </Button>
          </div>

          <Space size="middle" style={{ width: '100%' }}>
            <Search
              placeholder="ស្វែងរកទម្រង់..."
              allowClear
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            <Select
              style={{ width: 150 }}
              placeholder="ថ្នាក់"
              value={selectedGrade}
              onChange={setSelectedGrade}
            >
              <Option value="all">ថ្នាក់ទាំងអស់</Option>
              <Option value="G1">ថ្នាក់ទី១</Option>
              <Option value="G2">ថ្នាក់ទី២</Option>
              <Option value="G3">ថ្នាក់ទី៣</Option>
            </Select>
            <Select
              style={{ width: 150 }}
              placeholder="មុខវិជ្ជា"
              value={selectedSubject}
              onChange={setSelectedSubject}
            >
              <Option value="all">មុខវិជ្ជាទាំងអស់</Option>
              <Option value="KH">ភាសាខ្មែរ</Option>
              <Option value="MATH">គណិតវិទ្យា</Option>
            </Select>
          </Space>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : filteredForms.length === 0 ? (
            <Empty
              image={<FormOutlined style={{ fontSize: 64, color: '#bfbfbf' }} />}
              imageStyle={{ height: 80 }}
              description={
                <div>
                  <Text type="secondary" style={{ fontSize: '16px' }}>មិនទាន់មានទម្រង់វាយតម្លៃ</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '14px' }}>ចាប់ផ្តើមបង្កើតទម្រង់វាយតម្លៃដំបូងរបស់អ្នក</Text>
                </div>
              }
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/forms/new')}>
                បង្កើតទម្រង់ថ្មី
              </Button>
            </Empty>
          ) : (
            <List
              grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
              dataSource={filteredForms}
              renderItem={(form) => {
                const stats = getFormStats(form);
                return (
                  <List.Item>
                    <Card
                      hoverable
                      actions={[
                        <Button 
                          type="text" 
                          icon={<EyeOutlined />}
                          onClick={() => navigate(`/forms/${form.id}`)}
                        >
                          មើល
                        </Button>,
                        <Button 
                          type="text" 
                          icon={<EditOutlined />}
                          onClick={() => navigate(`/forms/${form.id}/edit`)}
                        >
                          កែសម្រួល
                        </Button>
                      ]}
                    >
                      <Card.Meta
                        avatar={<FormOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
                        title={form.name}
                        description={
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Text type="secondary">{form.description}</Text>
                            <Space wrap>
                              {form.targetGrades && form.targetGrades.length > 0 && (
                                <Tag color="blue">{getGradeDisplay(form.targetGrades)}</Tag>
                              )}
                              {form.targetSubjects && form.targetSubjects.length > 0 && (
                                <Tag color="green">{getSubjectDisplay(form.targetSubjects)}</Tag>
                              )}
                              <Tag>{stats.sections} ផ្នែក</Tag>
                              <Tag>{stats.fields} សំណួរ</Tag>
                            </Space>
                            <div style={{ marginTop: 8 }}>
                              <Tag color={form.status === 'published' ? 'success' : 'default'}>
                                {form.status === 'published' ? 'បានផ្សព្វផ្សាយ' : 'ព្រាងទុក'}
                              </Tag>
                            </div>
                          </Space>
                        }
                      />
                    </Card>
                  </List.Item>
                );
              }}
            />
          )}
        </Space>
      </Card>
    </div>
  );
};

export default FormsPageWithData;
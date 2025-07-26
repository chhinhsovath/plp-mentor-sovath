import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Button,
  Space,
  Typography,
  message,
  Spin,
  Row,
  Col,
  Divider,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { observationService } from '../services/observation.service';
import { formService } from '../services/form.service';
import { ObservationForm, ObservationSession } from '../types/observation';
import { FormTemplate } from '../types/form';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ObservationEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form] = Form.useForm();
  
  const isEditMode = id && id !== 'new';
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [observation, setObservation] = useState<ObservationSession | null>(null);
  const [observationForms, setObservationForms] = useState<ObservationForm[]>([]);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [selectedForm, setSelectedForm] = useState<ObservationForm | null>(null);
  const [selectedFormType, setSelectedFormType] = useState<'standard' | 'template' | 'khmer'>('standard');

  // Load observation forms and form templates
  useEffect(() => {
    loadObservationForms();
    loadFormTemplates();
  }, []);

  // Load existing observation if in edit mode
  useEffect(() => {
    if (isEditMode) {
      loadObservation();
    }
  }, [isEditMode, id]);

  const loadObservationForms = async () => {
    try {
      const forms = await observationService.getObservationForms({ isActive: true });
      setObservationForms(forms);
    } catch (error) {
      console.error('Error loading observation forms:', error);
      message.error(t('observations.loadFormsError'));
    }
  };

  const loadFormTemplates = async () => {
    try {
      const { forms } = await formService.getForms({ status: 'published' });
      setFormTemplates(forms);
    } catch (error) {
      console.error('Error loading form templates:', error);
    }
  };

  const loadObservation = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await observationService.getObservationById(id);
      setObservation(data);
      
      // Set form values
      form.setFieldsValue({
        formId: data.formId,
        schoolName: data.schoolName,
        teacherName: data.teacherName,
        observerName: data.observerName || user?.name,
        subject: data.subject,
        grade: data.gradeLevel || data.grade,
        observationDate: data.observationDate ? dayjs(data.observationDate) : null,
        startTime: data.startTime ? dayjs(data.startTime, 'HH:mm') : null,
        endTime: data.endTime ? dayjs(data.endTime, 'HH:mm') : null,
        numberOfStudents: data.numberOfStudents,
        numberOfFemaleStudents: data.numberOfFemaleStudents,
        reflectionSummary: data.reflectionSummary,
      });

      // Load the selected form
      if (data.formId) {
        const form = observationForms.find(f => f.id === data.formId);
        if (form) {
          setSelectedForm(form);
        } else {
          // Load form if not in the list
          try {
            const formData = await observationService.getObservationFormById(data.formId);
            setSelectedForm(formData);
          } catch (error) {
            console.error('Error loading form:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading observation:', error);
      message.error(t('observations.loadError'));
      navigate('/observations');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSelect = async (formId: string) => {
    const selected = observationForms.find(f => f.id === formId);
    if (selected) {
      setSelectedForm(selected);
      // Auto-fill subject and grade from form
      form.setFieldsValue({
        subject: selected.subject,
        grade: selected.gradeLevel,
      });
    }
  };

  const handleSave = async (values: any, status: 'draft' | 'in_progress' = 'draft') => {
    setSaving(true);
    try {
      const payload = {
        formId: values.formId,
        schoolName: values.schoolName,
        teacherName: values.teacherName,
        observerName: values.observerName || user?.name,
        subject: values.subject,
        grade: values.grade,
        dateObserved: values.observationDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        numberOfStudents: values.numberOfStudents,
        numberOfFemaleStudents: values.numberOfFemaleStudents,
        classificationLevel: values.classificationLevel || 'កម្រិត២',
        reflectionSummary: values.reflectionSummary,
        status,
      };

      if (isEditMode && id) {
        await observationService.updateObservation(id, payload);
        message.success(t('observations.updateSuccess'));
      } else {
        const newObservation = await observationService.createObservation(payload);
        message.success(t('observations.createSuccess'));
        navigate(`/observations/${newObservation.id}/edit`);
      }
    } catch (error) {
      console.error('Error saving observation:', error);
      message.error(t('observations.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        // If Khmer form is selected, redirect to the Khmer form page
        if (values.formType === 'khmer') {
          navigate('/observations/khmer-form');
          return;
        }
        handleSave(values, 'in_progress');
      })
      .catch(errorInfo => {
        console.error('Validation failed:', errorInfo);
        message.error(t('observations.validationError'));
      });
  };

  const handleSaveDraft = () => {
    const values = form.getFieldsValue();
    handleSave(values, 'draft');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Spin spinning={loading}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Header */}
            <div>
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/observations')}
                type="text"
              >
                {t('common.back')}
              </Button>
              <Title level={2}>
                {isEditMode ? t('observations.editObservation') : t('observations.newObservation')}
              </Title>
            </div>

            {/* Form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                observerName: user?.name,
                formType: 'standard',
              }}
            >
              {/* Form Selection */}
              <Card title={t('observations.formSelection')} style={{ marginBottom: 24 }}>
                <Form.Item
                  name="formType"
                  label="ប្រភេទទម្រង់សង្កេត"
                  rules={[{ required: true, message: 'សូមជ្រើសរើសប្រភេទទម្រង់' }]}
                >
                  <Select
                    placeholder="ជ្រើសរើសប្រភេទទម្រង់"
                    onChange={(value) => {
                      setSelectedFormType(value);
                      form.setFieldsValue({ formId: undefined });
                      setSelectedForm(null);
                    }}
                    disabled={isEditMode}
                  >
                    <Option value="standard">ទម្រង់សង្កេតស្តង់ដារ</Option>
                    <Option value="template">ទម្រង់ពីគំរូ</Option>
                    <Option value="khmer">ទម្រង់វាយតម្លៃការបង្រៀននិងរៀន</Option>
                  </Select>
                </Form.Item>

                {selectedFormType === 'standard' && (
                  <Form.Item
                    name="formId"
                    label={t('observations.observationForm')}
                    rules={[{ required: true, message: t('observations.formRequired') }]}
                  >
                    <Select
                      placeholder={t('observations.selectForm')}
                      onChange={handleFormSelect}
                      disabled={isEditMode}
                    >
                      {observationForms.map(form => (
                        <Option key={form.id} value={form.id}>
                          {form.name} - {form.gradeLevel} ({form.subject})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}

                {selectedFormType === 'template' && (
                  <Form.Item
                    name="formId"
                    label="ជ្រើសរើសគំរូទម្រង់"
                    rules={[{ required: true, message: 'សូមជ្រើសរើសគំរូទម្រង់' }]}
                  >
                    <Select
                      placeholder="ជ្រើសរើសគំរូទម្រង់"
                      onChange={handleFormSelect}
                      disabled={isEditMode}
                    >
                      {formTemplates.map(form => (
                        <Option key={form.id} value={form.id}>
                          {form.nameKm || form.name} - {form.descriptionKm || form.description}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}

                {selectedFormType === 'khmer' && (
                  <Alert
                    message="ទម្រង់វាយតម្លៃការបង្រៀននិងរៀន"
                    description="អ្នកនឹងត្រូវបញ្ជូនទៅកាន់ទំព័រទម្រង់វាយតម្លៃការបង្រៀននិងរៀន"
                    type="info"
                    showIcon
                    action={
                      <Button
                        type="primary"
                        onClick={() => navigate('/observations/khmer-form')}
                      >
                        បន្តទៅទម្រង់
                      </Button>
                    }
                  />
                )}

                {selectedForm && selectedFormType !== 'khmer' && (
                  <Alert
                    message={selectedForm.description}
                    type="info"
                    showIcon
                  />
                )}
              </Card>

              {/* Basic Information - Only show if not Khmer form */}
              {selectedFormType !== 'khmer' && (
              <Card title={t('observations.basicInfo')} style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="schoolName"
                      label={t('observations.school')}
                      rules={[{ required: true, message: t('observations.schoolRequired') }]}
                    >
                      <Input placeholder={t('observations.enterSchoolName')} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="teacherName"
                      label={t('observations.teacher')}
                      rules={[{ required: true, message: t('observations.teacherRequired') }]}
                    >
                      <Input placeholder={t('observations.enterTeacherName')} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="observerName"
                      label={t('observations.observer')}
                      rules={[{ required: true, message: t('observations.observerRequired') }]}
                    >
                      <Input placeholder={t('observations.enterObserverName')} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="subject"
                      label={t('observations.subject')}
                      rules={[{ required: true, message: t('observations.subjectRequired') }]}
                    >
                      <Select placeholder={t('observations.selectSubject')}>
                        <Option value="Khmer">ភាសាខ្មែរ</Option>
                        <Option value="Mathematics">គណិតវិទ្យា</Option>
                        <Option value="Science">វិទ្យាសាស្ត្រ</Option>
                        <Option value="Social Studies">សិក្សាសង្គម</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="grade"
                      label={t('observations.grade')}
                      rules={[{ required: true, message: t('observations.gradeRequired') }]}
                    >
                      <Select placeholder={t('observations.selectGrade')}>
                        <Option value="1">ថ្នាក់ទី១</Option>
                        <Option value="2">ថ្នាក់ទី២</Option>
                        <Option value="3">ថ្នាក់ទី៣</Option>
                        <Option value="4">ថ្នាក់ទី៤</Option>
                        <Option value="5">ថ្នាក់ទី៥</Option>
                        <Option value="6">ថ្នាក់ទី៦</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
              )}

              {/* Date and Time - Only show if not Khmer form */}
              {selectedFormType !== 'khmer' && (
              <Card title={t('observations.dateTime')} style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="observationDate"
                      label={t('observations.date')}
                      rules={[{ required: true, message: t('observations.dateRequired') }]}
                    >
                      <DatePicker 
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="startTime"
                      label={t('observations.startTime')}
                      rules={[{ required: true, message: t('observations.startTimeRequired') }]}
                    >
                      <TimePicker 
                        style={{ width: '100%' }}
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="endTime"
                      label={t('observations.endTime')}
                      rules={[{ required: true, message: t('observations.endTimeRequired') }]}
                    >
                      <TimePicker 
                        style={{ width: '100%' }}
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
              )}

              {/* Student Information - Only show if not Khmer form */}
              {selectedFormType !== 'khmer' && (
              <Card title={t('observations.studentInfo')} style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="numberOfStudents"
                      label={t('observations.totalStudents')}
                      rules={[{ required: true, message: t('observations.totalStudentsRequired') }]}
                    >
                      <Input type="number" min={0} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="numberOfFemaleStudents"
                      label={t('observations.femaleStudents')}
                      rules={[{ required: true, message: t('observations.femaleStudentsRequired') }]}
                    >
                      <Input type="number" min={0} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
              )}

              {/* Reflection Summary - Only show if not Khmer form */}
              {selectedFormType !== 'khmer' && (
              <Card title={t('observations.reflection')} style={{ marginBottom: 24 }}>
                <Form.Item
                  name="reflectionSummary"
                  label={t('observations.reflectionSummary')}
                >
                  <TextArea 
                    rows={4} 
                    placeholder={t('observations.enterReflection')}
                  />
                </Form.Item>
              </Card>
              )}

              {/* Actions */}
              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => navigate('/observations')}>
                    {t('common.cancel')}
                  </Button>
                  {selectedFormType !== 'khmer' && (
                  <Button 
                    onClick={handleSaveDraft}
                    loading={saving}
                    disabled={saving}
                  >
                    {t('observations.saveDraft')}
                  </Button>
                  )}
                  <Button 
                    type="primary"
                    htmlType="submit"
                    icon={<SendOutlined />}
                    loading={saving}
                    disabled={saving && selectedFormType !== 'khmer'}
                  >
                    {selectedFormType === 'khmer' ? 'បន្តទៅទំរង់' : t('observations.saveAndContinue')}
                  </Button>
                </Space>
              </div>
            </Form>
          </Space>
        </Card>
      </Spin>
    </div>
  );
};

export default ObservationEditPage;
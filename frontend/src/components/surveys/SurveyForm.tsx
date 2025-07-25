import React, { useState, useEffect, useCallback } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  Checkbox,
  DatePicker,
  TimePicker,
  Upload,
  Button,
  Space,
  Card,
  Progress,
  Alert,
  Typography,
  message,
  Spin,
} from 'antd';
import {
  UploadOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Survey, Question, Answer, SurveyResponse } from '../../types/survey';
import { evaluateCondition } from '../../utils/surveyLogic';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface SurveyFormProps {
  survey: Survey;
  response?: SurveyResponse;
  onSubmit: (data: { answers: Answer[]; metadata?: any }) => Promise<SurveyResponse>;
  onSaveDraft?: (data: { answers: Answer[]; metadata?: any }) => Promise<SurveyResponse>;
  isPreview?: boolean;
}

interface FormValues {
  [key: string]: any;
}

const SurveyForm: React.FC<SurveyFormProps> = ({
  survey,
  response,
  onSubmit,
  onSaveDraft,
  isPreview = false,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [currentPage, setCurrentPage] = useState(0);
  const [visibleQuestions, setVisibleQuestions] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<Map<string, File[]>>(new Map());
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  // Group questions by groupId or use individual questions as pages
  const pages = useCallback(() => {
    const groups: Question[][] = [];
    const groupMap = new Map<string, Question[]>();
    const ungrouped: Question[] = [];

    survey.questions.forEach((question) => {
      if (question.groupId) {
        if (!groupMap.has(question.groupId)) {
          groupMap.set(question.groupId, []);
        }
        groupMap.get(question.groupId)!.push(question);
      } else {
        ungrouped.push(question);
      }
    });

    // Add grouped questions
    groupMap.forEach((questions) => {
      groups.push(questions.sort((a, b) => a.order - b.order));
    });

    // Add ungrouped questions as individual pages
    ungrouped
      .sort((a, b) => a.order - b.order)
      .forEach((question) => {
        groups.push([question]);
      });

    return groups;
  }, [survey.questions]);

  const currentQuestions = pages()[currentPage] || [];
  const totalPages = pages().length;
  const progress = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0;

  // Initialize form with existing response data
  useEffect(() => {
    if (response?.answers) {
      const initialValues: FormValues = {};
      response.answers.forEach((answer) => {
        initialValues[answer.questionId] = answer.answer;
      });
      form.setFieldsValue(initialValues);
    }
  }, [response, form]);

  // Evaluate question visibility based on conditional logic
  useEffect(() => {
    const formValues = form.getFieldsValue();
    const visible = new Set<string>();

    survey.questions.forEach((question) => {
      if (!question.logic || question.logic.conditions.length === 0) {
        visible.add(question.id!);
      } else {
        const shouldShow = evaluateCondition(question.logic, formValues);
        if (shouldShow) {
          visible.add(question.id!);
        }
      }
    });

    setVisibleQuestions(visible);
  }, [survey.questions, form]);

  const handleValuesChange = () => {
    // Re-evaluate visibility when form values change
    const formValues = form.getFieldsValue();
    const visible = new Set<string>();

    survey.questions.forEach((question) => {
      if (!question.logic || question.logic.conditions.length === 0) {
        visible.add(question.id!);
      } else {
        const shouldShow = evaluateCondition(question.logic, formValues);
        if (shouldShow) {
          visible.add(question.id!);
        }
      }
    });

    setVisibleQuestions(visible);
  };

  const renderQuestion = (question: Question) => {
    if (!visibleQuestions.has(question.id!)) {
      return null;
    }

    const commonProps = {
      label: (
        <Space>
          {question.label}
          {question.required && <span style={{ color: 'red' }}>*</span>}
        </Space>
      ),
      name: question.id,
      rules: question.required ? [{ required: true, message: `${question.label} is required` }] : [],
      help: question.description,
    };

    switch (question.type) {
      case 'text':
        return (
          <Form.Item {...commonProps}>
            <Input
              placeholder={question.placeholder}
              maxLength={question.validation?.maxLength}
            />
          </Form.Item>
        );

      case 'textarea':
        return (
          <Form.Item {...commonProps}>
            <TextArea
              rows={4}
              placeholder={question.placeholder}
              maxLength={question.validation?.maxLength}
            />
          </Form.Item>
        );

      case 'number':
        return (
          <Form.Item {...commonProps}>
            <InputNumber
              style={{ width: '100%' }}
              placeholder={question.placeholder}
              min={question.validation?.min}
              max={question.validation?.max}
            />
          </Form.Item>
        );

      case 'date':
        return (
          <Form.Item {...commonProps}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        );

      case 'time':
        return (
          <Form.Item {...commonProps}>
            <TimePicker style={{ width: '100%' }} />
          </Form.Item>
        );

      case 'select':
        return (
          <Form.Item {...commonProps}>
            <Select placeholder={question.placeholder}>
              {question.options?.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 'radio':
        return (
          <Form.Item {...commonProps}>
            <Radio.Group>
              <Space direction="vertical">
                {question.options?.map((option) => (
                  <Radio key={option.value} value={option.value}>
                    {option.label}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>
        );

      case 'checkbox':
        return (
          <Form.Item {...commonProps}>
            <Checkbox.Group>
              <Space direction="vertical">
                {question.options?.map((option) => (
                  <Checkbox key={option.value} value={option.value}>
                    {option.label}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
        );

      case 'file':
        return (
          <Form.Item {...commonProps}>
            <Upload
              beforeUpload={(file) => {
                const questionFiles = files.get(question.id!) || [];
                setFiles(new Map(files).set(question.id!, [...questionFiles, file]));
                return false;
              }}
              onRemove={(file) => {
                const questionFiles = files.get(question.id!) || [];
                setFiles(
                  new Map(files).set(
                    question.id!,
                    questionFiles.filter((f) => f !== file)
                  )
                );
              }}
              accept={question.validation?.acceptedFileTypes?.join(',')}
            >
              <Button icon={<UploadOutlined />}>Upload File</Button>
            </Upload>
          </Form.Item>
        );

      case 'location':
        return (
          <Form.Item {...commonProps}>
            <Button
              icon={<EnvironmentOutlined />}
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const loc = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                      };
                      setLocation(loc);
                      form.setFieldValue(question.id!, loc);
                      message.success('Location captured successfully');
                    },
                    (error) => {
                      message.error('Failed to get location');
                    }
                  );
                } else {
                  message.error('Geolocation is not supported by your browser');
                }
              }}
            >
              {location ? 'Location Captured' : 'Capture Location'}
            </Button>
            {location && (
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
              </Text>
            )}
          </Form.Item>
        );

      case 'audio':
        return (
          <Form.Item {...commonProps}>
            <Button icon={<AudioOutlined />} disabled>
              Record Audio (Not implemented in preview)
            </Button>
          </Form.Item>
        );

      case 'video':
        return (
          <Form.Item {...commonProps}>
            <Button icon={<VideoCameraOutlined />} disabled>
              Record Video (Not implemented in preview)
            </Button>
          </Form.Item>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setSubmitting(true);

      const formValues = form.getFieldsValue();
      const answers: Answer[] = [];

      // Collect answers only for visible questions
      survey.questions.forEach((question) => {
        if (visibleQuestions.has(question.id!) && formValues[question.id!] !== undefined) {
          const answer: Answer = {
            questionId: question.id!,
            answer: formValues[question.id!],
          };

          // Add files if any
          const questionFiles = files.get(question.id!);
          if (questionFiles && questionFiles.length > 0) {
            answer.files = questionFiles.map((file) => ({
              originalName: file.name,
              filename: `${question.id}_${file.name}`,
              mimetype: file.type,
              size: file.size,
              path: '', // Will be set by backend
            }));
          }

          answers.push(answer);
        }
      });

      const metadata = {
        duration: Math.floor((Date.now() - startTime) / 1000),
        ...(location && { location }),
      };

      await onSubmit({ answers, metadata });
      
      if (!isPreview) {
        message.success('Survey submitted successfully!');
      }
    } catch (error) {
      message.error('Please fill in all required fields');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;

    try {
      const formValues = form.getFieldsValue();
      const answers: Answer[] = [];

      survey.questions.forEach((question) => {
        if (formValues[question.id!] !== undefined) {
          answers.push({
            questionId: question.id!,
            answer: formValues[question.id!],
          });
        }
      });

      await onSaveDraft({ answers });
      message.success('Draft saved successfully');
    } catch (error) {
      message.error('Failed to save draft');
    }
  };

  return (
    <div className="survey-form">
      {survey.settings?.showProgressBar && (
        <Progress percent={progress} showInfo={false} style={{ marginBottom: 24 }} />
      )}

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        onFinish={handleSubmit}
      >
        <Card>
          {currentQuestions.map((question) => (
            <div key={question.id}>{renderQuestion(question)}</div>
          ))}

          {currentQuestions.length === 0 && (
            <Alert
              message="No questions available"
              description="This page has no visible questions based on your previous answers."
              type="info"
            />
          )}
        </Card>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Space>
            {currentPage > 0 && (
              <Button onClick={() => setCurrentPage(currentPage - 1)}>
                Previous
              </Button>
            )}

            {!isPreview && onSaveDraft && (
              <Button onClick={handleSaveDraft}>Save Draft</Button>
            )}

            {currentPage < totalPages - 1 ? (
              <Button type="primary" onClick={() => setCurrentPage(currentPage + 1)}>
                Next
              </Button>
            ) : (
              <Button type="primary" htmlType="submit" loading={submitting}>
                Submit
              </Button>
            )}
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default SurveyForm;
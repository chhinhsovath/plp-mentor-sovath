import React from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Radio,
  Checkbox,
  Rate,
  Slider,
  Upload,
  Typography,
  Row,
  Col,
  Divider,
  Space,
  DatePicker,
  TimePicker,
  InputNumber,
  Button,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { FormTemplate, FormField } from '../../types/form';

interface FormFieldPreviewProps {
  form: FormTemplate;
}

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const FormFieldPreview: React.FC<FormFieldPreviewProps> = ({ form }) => {
  const { t, i18n } = useTranslation();

  // Helper to translate values that look like translation keys
  const translateIfKey = (value: string | undefined): string | undefined => {
    if (!value) return value;
    // Check if value looks like a translation key (contains dots)
    if (value.includes('.') && !value.includes(' ')) {
      return t(value);
    }
    return value;
  };

  const renderField = (field: FormField) => {
    const label = translateIfKey(field.label) || field.label;
    const description = translateIfKey(field.description) || field.description;
    const placeholder = translateIfKey(field.placeholder) || field.placeholder;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <Form.Item
            label={label}
            required={field.validation?.required}
            extra={description}
          >
            <Input type={field.type} placeholder={placeholder} />
          </Form.Item>
        );

      case 'number':
        return (
          <Form.Item
            label={label}
            required={field.validation?.required}
            extra={description}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder={placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
            />
          </Form.Item>
        );

      case 'textarea':
        return (
          <Form.Item
            label={label}
            required={field.validation?.required}
            extra={description}
          >
            <TextArea rows={4} placeholder={placeholder} />
          </Form.Item>
        );

      case 'date':
        return (
          <Form.Item
            label={label}
            required={field.validation?.required}
            extra={description}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        );

      case 'time':
        return (
          <Form.Item
            label={label}
            required={field.validation?.required}
            extra={description}
          >
            <TimePicker style={{ width: '100%' }} />
          </Form.Item>
        );

      case 'datetime':
        return (
          <Form.Item
            label={label}
            required={field.validation?.required}
            extra={description}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        );

      case 'select':
        return (
          <Form.Item
            label={label}
            required={field.validation?.required}
            extra={description}
          >
            <Select placeholder={t('common.select')}>
              {field.options?.map((option) => (
                <Option key={option.value} value={option.value}>
                  {translateIfKey(option.label) || option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 'multiselect':
        return (
          <Form.Item
            label={label}
            required={field.validation?.required}
            extra={description}
          >
            <Select mode="multiple" placeholder={t('common.select')}>
              {field.options?.map((option) => (
                <Option key={option.value} value={option.value}>
                  {translateIfKey(option.label) || option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 'radio':
        return (
          <Form.Item
            label={label}
            required={field.validation?.required}
            extra={description}
          >
            <Radio.Group>
              <Space direction="vertical">
                {field.options?.map((option) => (
                  <Radio key={option.value} value={option.value}>
                    {translateIfKey(option.label) || option.label}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>
        );

      case 'checkbox':
        return (
          <Form.Item
            label={label}
            required={field.validation?.required}
            extra={description}
          >
            <Checkbox.Group>
              <Space direction="vertical">
                {field.options?.map((option) => (
                  <Checkbox key={option.value} value={option.value}>
                    {translateIfKey(option.label) || option.label}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
        );

      case 'rating':
        return (
          <Form.Item
            label={label}
            required={field.validation?.required}
            extra={description}
          >
            <Rate allowHalf />
          </Form.Item>
        );

      case 'scale':
        return (
          <Form.Item
            label={label}
            required={field.validation?.required}
            extra={description}
          >
            <Slider
              defaultValue={5}
              min={field.validation?.min || 0}
              max={field.validation?.max || 10}
              marks
            />
          </Form.Item>
        );

      case 'file':
        return (
          <Form.Item
            label={label}
            required={field.validation?.required}
            extra={description}
          >
            <Upload>
              <Button icon={<UploadOutlined />}>
                {t('common.uploadFile')}
              </Button>
            </Upload>
          </Form.Item>
        );

      case 'section':
        return (
          <div style={{ marginBottom: 16 }}>
            <Title level={4}>{label}</Title>
            {description && (
              <Paragraph type="secondary">{description}</Paragraph>
            )}
          </div>
        );

      case 'divider':
        return <Divider />;

      default:
        return null;
    }
  };

  return (
    <div>
      <Title level={3}>{form.name}</Title>
      {form.description && (
        <Paragraph type="secondary">{form.description}</Paragraph>
      )}

      {form.sections.map((section) => (
        <Card key={section.id} style={{ marginBottom: 24 }}>
          <Title level={4}>{section.title}</Title>
          {section.description && (
            <Paragraph type="secondary">{section.description}</Paragraph>
          )}
          <Form layout="vertical">
            <Row gutter={16}>
              {section.fields.map((field) => (
                <Col
                  key={field.id}
                  xs={field.grid?.xs || 24}
                  sm={field.grid?.sm || 24}
                  md={field.grid?.md || 12}
                  lg={field.grid?.lg || 12}
                >
                  {renderField(field)}
                </Col>
              ))}
            </Row>
          </Form>
        </Card>
      ))}
    </div>
  );
};

export default FormFieldPreview;
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Typography,
  Row,
  Col,
  Switch,
  InputNumber,
  List,
  Space,
  Divider,
  Card,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { FormField, FieldOption } from '../../types/form';

interface FormFieldEditorProps {
  open: boolean;
  field: FormField;
  onClose: () => void;
  onSave: (field: FormField) => void;
}

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const FormFieldEditor: React.FC<FormFieldEditorProps> = ({
  open,
  field,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [editedField, setEditedField] = useState<FormField>(field);
  const [newOption, setNewOption] = useState({ label: '', value: '' });

  useEffect(() => {
    setEditedField(field);
    form.setFieldsValue(field);
  }, [field, form]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      // Auto-generate name from label if not provided
      if (!values.name && values.label) {
        values.name = values.label
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_');
      }
      
      const updatedField = {
        ...editedField,
        ...values,
      };
      
      onSave(updatedField);
    });
  };

  const handleAddOption = () => {
    if (!newOption.label) return;
    
    const option: FieldOption = {
      label: newOption.label,
      value: newOption.value || newOption.label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    };

    const updatedField = {
      ...editedField,
      options: [...(editedField.options || []), option],
    };
    
    setEditedField(updatedField);
    setNewOption({ label: '', value: '' });
  };

  const handleDeleteOption = (index: number) => {
    const updatedField = {
      ...editedField,
      options: editedField.options?.filter((_, i) => i !== index),
    };
    setEditedField(updatedField);
  };

  const hasOptions = ['select', 'multiselect', 'radio', 'checkbox'].includes(editedField.type);

  return (
    <Modal
      title={field.id ? t('forms.editField') : t('forms.addField')}
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common.cancel')}
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          {t('common.save')}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={field}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="label"
              label={t('forms.fieldLabel')}
              rules={[{ required: true, message: 'Please enter field label' }]}
            >
              <Input 
                placeholder={t('forms.fieldLabel')}
                onChange={(e) => setEditedField(prev => ({ ...prev, label: e.target.value }))}
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="name"
              label={t('forms.fieldName')}
              extra={t('forms.fieldNameHelp')}
            >
              <Input 
                placeholder={t('forms.fieldName')}
                onChange={(e) => setEditedField(prev => ({ ...prev, name: e.target.value }))}
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item name="placeholder" label={t('forms.placeholder')}>
              <Input 
                placeholder={t('forms.placeholder')}
                onChange={(e) => setEditedField(prev => ({ ...prev, placeholder: e.target.value }))}
              />
            </Form.Item>
          </Col>
          
          <Col span={24}>
            <Form.Item name="description" label={t('forms.fieldDescription')}>
              <TextArea 
                rows={2}
                placeholder={t('forms.fieldDescription')}
                onChange={(e) => setEditedField(prev => ({ ...prev, description: e.target.value }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">
          <Title level={5}>{t('forms.validation')}</Title>
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name={['validation', 'required']} valuePropName="checked">
              <Space>
                <Switch onChange={(checked) => setEditedField(prev => ({
                  ...prev,
                  validation: { ...prev.validation, required: checked },
                }))} />
                <Text>{t('forms.required')}</Text>
              </Space>
            </Form.Item>
          </Col>

          {(editedField.type === 'text' || editedField.type === 'textarea') && (
            <>
              <Col span={12}>
                <Form.Item name={['validation', 'minLength']} label={t('forms.minLength')}>
                  <InputNumber 
                    style={{ width: '100%' }}
                    min={0}
                    onChange={(value) => setEditedField(prev => ({
                      ...prev,
                      validation: { ...prev.validation, minLength: value || undefined },
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['validation', 'maxLength']} label={t('forms.maxLength')}>
                  <InputNumber 
                    style={{ width: '100%' }}
                    min={0}
                    onChange={(value) => setEditedField(prev => ({
                      ...prev,
                      validation: { ...prev.validation, maxLength: value || undefined },
                    }))}
                  />
                </Form.Item>
              </Col>
            </>
          )}

          {editedField.type === 'number' && (
            <>
              <Col span={12}>
                <Form.Item name={['validation', 'min']} label={t('forms.min')}>
                  <InputNumber 
                    style={{ width: '100%' }}
                    onChange={(value) => setEditedField(prev => ({
                      ...prev,
                      validation: { ...prev.validation, min: value || undefined },
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['validation', 'max']} label={t('forms.max')}>
                  <InputNumber 
                    style={{ width: '100%' }}
                    onChange={(value) => setEditedField(prev => ({
                      ...prev,
                      validation: { ...prev.validation, max: value || undefined },
                    }))}
                  />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>

        {hasOptions && (
          <>
            <Divider orientation="left">
              <Title level={5}>{t('forms.options')}</Title>
            </Divider>
            
            <Card size="small" style={{ marginBottom: 16 }}>
              <List
                size="small"
                dataSource={editedField.options || []}
                renderItem={(option, index) => (
                  <List.Item
                    actions={[
                      <Button
                        key="delete"
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteOption(index)}
                      />
                    ]}
                  >
                    <Text>{option.label}</Text>
                  </List.Item>
                )}
              />
              
              <Space.Compact style={{ width: '100%', marginTop: 8 }}>
                <Input
                  placeholder={t('forms.optionLabel')}
                  value={newOption.label}
                  onChange={(e) => setNewOption(prev => ({ ...prev, label: e.target.value }))}
                  onPressEnter={handleAddOption}
                />
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleAddOption}
                  disabled={!newOption.label}
                >
                  {t('common.add')}
                </Button>
              </Space.Compact>
            </Card>
          </>
        )}

        <Divider orientation="left">
          <Title level={5}>{t('forms.layout')}</Title>
        </Divider>

        <Row gutter={8}>
          <Col span={6}>
            <Form.Item name={['grid', 'xs']} label="XS" initialValue={12}>
              <Select>
                {[12, 6, 4, 3].map(v => (
                  <Option key={v} value={v}>{v}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['grid', 'sm']} label="SM" initialValue={12}>
              <Select>
                {[12, 6, 4, 3].map(v => (
                  <Option key={v} value={v}>{v}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['grid', 'md']} label="MD" initialValue={6}>
              <Select>
                {[12, 6, 4, 3].map(v => (
                  <Option key={v} value={v}>{v}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name={['grid', 'lg']} label="LG" initialValue={6}>
              <Select>
                {[12, 6, 4, 3].map(v => (
                  <Option key={v} value={v}>{v}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default FormFieldEditor;
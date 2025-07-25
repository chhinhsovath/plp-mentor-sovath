import React, { useState } from 'react';
import {
  Form,
  Input,
  Switch,
  Select,
  Button,
  Space,
  InputNumber,
  Divider,
  Card,
  Row,
  Col,
  Tag,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Question, QuestionOption, QuestionValidation } from '../../types/survey';
import { v4 as uuidv4 } from 'uuid';

const { TextArea } = Input;
const { Option } = Select;

interface QuestionEditorProps {
  question: Question;
  allQuestions: Question[];
  onUpdate: (updates: Partial<Question>) => void;
  onClose: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  allQuestions,
  onUpdate,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [options, setOptions] = useState<QuestionOption[]>(question.options || []);

  const handleFormChange = (changedValues: any) => {
    onUpdate(changedValues);
  };

  const addOption = () => {
    const newOption: QuestionOption = {
      label: `ជម្រើសទី ${options.length + 1}`,
      value: `option${options.length + 1}`,
      order: options.length,
    };
    const updatedOptions = [...options, newOption];
    setOptions(updatedOptions);
    onUpdate({ options: updatedOptions });
  };

  const updateOption = (index: number, field: 'label' | 'value', value: string) => {
    const updatedOptions = [...options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setOptions(updatedOptions);
    onUpdate({ options: updatedOptions });
  };

  const removeOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
    onUpdate({ options: updatedOptions });
  };

  const updateValidation = (field: keyof QuestionValidation, value: any) => {
    const currentValidation = question.validation || {};
    onUpdate({
      validation: {
        ...currentValidation,
        [field]: value,
      },
    });
  };

  const showOptionsEditor = ['select', 'radio', 'checkbox'].includes(question.type);
  const showValidation = ['text', 'textarea', 'number', 'file'].includes(question.type);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={question}
      onValuesChange={handleFormChange}
    >
      <Form.Item
        name="label"
        label="ស្លាកសំណួរ"
        rules={[{ required: true, message: 'សូមបញ្ចូលស្លាកសំណួរ' }]}
      >
        <Input placeholder="បញ្ចូលអត្ថបទសំណួរ" />
      </Form.Item>

      <Form.Item name="description" label="ការពិពណ៌នា">
        <TextArea placeholder="បន្ថែមការពិពណ៌នា ឬអត្ថបទជំនួយ (ស្រេចចិត្ត)" rows={2} />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="placeholder" label="អត្ថបទគំរូ">
            <Input placeholder="អត្ថបទគំរូ" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="required" label="តម្រូវ" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      {showOptionsEditor && (
        <>
          <Divider>ជម្រើស</Divider>
          <Space direction="vertical" style={{ width: '100%' }}>
            {options.map((option, index) => (
              <Space key={index} style={{ width: '100%' }}>
                <Input
                  value={option.label}
                  onChange={(e) => updateOption(index, 'label', e.target.value)}
                  placeholder="ស្លាកជម្រើស"
                  style={{ width: 200 }}
                />
                <Input
                  value={option.value}
                  onChange={(e) => updateOption(index, 'value', e.target.value)}
                  placeholder="តម្លៃជម្រើស"
                  style={{ width: 150 }}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeOption(index)}
                  disabled={options.length <= 1}
                />
              </Space>
            ))}
            <Button type="dashed" onClick={addOption} icon={<PlusOutlined />}>
              បន្ថែមជម្រើស
            </Button>
          </Space>

          {question.type === 'checkbox' && (
            <Form.Item
              name="allowOther"
              label="អនុញ្ញាតជម្រើស 'ផ្សេងៗ'"
              valuePropName="checked"
              style={{ marginTop: 16 }}
            >
              <Switch />
            </Form.Item>
          )}
        </>
      )}

      {showValidation && (
        <>
          <Divider>ការបញ្ជាក់</Divider>
          {question.type === 'number' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="តម្លៃអប្បបរមា">
                  <InputNumber
                    value={question.validation?.min}
                    onChange={(value) => updateValidation('min', value)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="តម្លៃអតិបរមា">
                  <InputNumber
                    value={question.validation?.max}
                    onChange={(value) => updateValidation('max', value)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          {['text', 'textarea'].includes(question.type) && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="ប្រវែងអប្បបរមា">
                  <InputNumber
                    value={question.validation?.minLength}
                    onChange={(value) => updateValidation('minLength', value)}
                    style={{ width: '100%' }}
                    min={0}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ប្រវែងអតិបរមា">
                  <InputNumber
                    value={question.validation?.maxLength}
                    onChange={(value) => updateValidation('maxLength', value)}
                    style={{ width: '100%' }}
                    min={0}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          {question.type === 'text' && (
            <Form.Item label="គំរូ (Regex)">
              <Input
                value={question.validation?.pattern}
                onChange={(e) => updateValidation('pattern', e.target.value)}
                placeholder="e.g., ^[A-Z0-9]+$"
              />
            </Form.Item>
          )}

          {question.type === 'file' && (
            <>
              <Form.Item label="ប្រភេទឯកសារដែលទទួលយក">
                <Select
                  mode="tags"
                  value={question.validation?.acceptedFileTypes}
                  onChange={(value) => updateValidation('acceptedFileTypes', value)}
                  placeholder="ឧទាហរណ៍ image/*, .pdf, .doc"
                >
                  <Option value="image/*">រូបភាព</Option>
                  <Option value="video/*">វីដេអូ</Option>
                  <Option value="audio/*">សំឡេង</Option>
                  <Option value=".pdf">PDF</Option>
                  <Option value=".doc,.docx">ឯកសារ Word</Option>
                  <Option value=".xls,.xlsx">ឯកសារ Excel</Option>
                </Select>
              </Form.Item>
              <Form.Item label="ទំហំឯកសារអតិបរមា (MB)">
                <InputNumber
                  value={question.validation?.maxFileSize}
                  onChange={(value) => updateValidation('maxFileSize', value)}
                  min={1}
                  max={50}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </>
          )}
        </>
      )}

      <Divider>ជំរើសកម្រិតខ្ពស់</Divider>

      <Form.Item name="groupId" label="លេខសម្គាល់ក្រុម">
        <Input placeholder="ដាក់សំណួរជាក្រុម (ស្រេចចិត្ត)" />
      </Form.Item>

      <Form.Item label="សំណួរមេ">
        <Select
          value={question.parentQuestionId}
          onChange={(value) => onUpdate({ parentQuestionId: value })}
          placeholder="ជ្រើសរើសសំណួរមេសម្រាប់ការបែងចែក"
          allowClear
        >
          {allQuestions
            .filter((q) => q.id !== question.id)
            .map((q) => (
              <Option key={q.id} value={q.id}>
                {q.label}
              </Option>
            ))}
        </Select>
      </Form.Item>

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Button onClick={onClose}>រួចរាល់</Button>
      </div>
    </Form>
  );
};

export default QuestionEditor;
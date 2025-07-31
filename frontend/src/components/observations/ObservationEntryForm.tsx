import React, { useState } from 'react';
import { Form, Input, Select, Radio, Space, Button, Card, Row, Col, Divider, InputNumber, message } from 'antd';
import { SaveOutlined, SendOutlined } from '@ant-design/icons';
import teacherObservations456Service from '../../services/teacherObservations456.service';

const { TextArea } = Input;
const { Option } = Select;

export interface ObservationFormData {
  // Header information
  schoolName: string;
  schoolCode: string;
  village: string;
  commune: string;
  district: string;
  province: string;
  cluster: string;
  observerName: string;
  observerCode: string;
  observerPosition: string;
  observationDate: string;
  grade: string;
  group: string;
  classType: string; // ពហុកម្រិត or regular
  subject: string;
  teacherName: string;
  teacherCode: string;
  teacherGender: string;
  startTime: string;
  endTime: string;
  topic: string;
  
  // Section scores
  introductionScores: { [key: string]: number };
  teachingScores: { [key: string]: number };
  learningScores: { [key: string]: number };
  assessmentScores: { [key: string]: number };
  
  // Student counts by grade
  studentCounts: {
    grade1: { male: number; female: number };
    grade2: { male: number; female: number };
    grade3: { male: number; female: number };
    grade4: { male: number; female: number };
    grade5: { male: number; female: number };
    grade6: { male: number; female: number };
  };
  
  // Attendance
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  
  // Comments and improvement plans
  comments: string;
  teachingImprovements: string;
  principalSupport: string;
  clusterSupport: string;
  
  // Signatures
  observerSignature: string;
  teacherSignature: string;
}

interface ObservationEntryFormProps {
  onSubmit?: (values: ObservationFormData) => void;
  initialValues?: Partial<ObservationFormData>;
  isPublic?: boolean;
  hideHeader?: boolean;
}

const ObservationEntryForm: React.FC<ObservationEntryFormProps> = ({ 
  onSubmit, 
  initialValues, 
  isPublic = false,
  hideHeader = false 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(values);
      } else {
        // If no custom onSubmit provided, use the default API service
        await teacherObservations456Service.create(values);
      }
      message.success('ទម្រង់ត្រូវបានរក្សាទុកដោយជោគជ័យ');
      form.resetFields();
      localStorage.removeItem('observation-draft');
    } catch (error) {
      console.error('Error submitting form:', error);
      message.error('មានបញ្ហាក្នុងការរក្សាទុកទម្រង់');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    const values = form.getFieldsValue();
    localStorage.setItem('observation-draft', JSON.stringify(values));
    message.success('ព្រាងត្រូវបានរក្សាទុក');
  };

  // Section I: Introduction activities
  const introductionItems = [
    { id: 'intro1', label: '១. ដំណឹងអំពីគោលបំណងនៃមេរៀននិងសំណួរឬសកម្មភាព' },
    { id: 'intro2', label: '២. ភាពទាក់ទងនឹងមេរៀនមុននិងដឹងនាំមេរៀនថ្មីឬសំណួរដ៏មានប្រសិទ្ធភាព' },
    { id: 'intro3', label: '៣. ក្បួនច្បាប់សម្រាប់ការងារជាក្រុមនិងគោលការណ៍នៅក្នុងថ្នាក់ដឹងច្បាស់លាស់ដល់សិស្ស' },
  ];

  // Section II: Teaching activities
  const teachingItems = [
    { id: 'teach1', label: '៤. សម្ភារៈបង្រៀនបានរៀបចំត្រឹមត្រូវនិងមានអត្ថន័យសម្រាប់សិស្សទាំងអស់' },
    { id: 'teach2', label: '៥. ជំនួយឬការគាំទ្រដល់សិស្សដើម្បីអាចសម្រេចបានដោយស្របតាមមេរៀនបង្រៀន' },
    { id: 'teach3', label: '៦. ការធ្វើឱ្យសិស្សចូលរួមសកម្មក្នុងការសិក្សានិងការពន្យល់ឬសួរ និងវាយតម្លៃដូច' },
    { id: 'teach4', label: '៧. បង្កើនឱកាសដល់សិស្សឱ្យពួកគេចែករំលែកនូវអ្វីដែលពួកគេបានរៀន' },
    { id: 'teach5', label: '៨. រចនាសម្ព័ន្ធដឹកនាំសិស្សក្នុងការអនុវត្តសកម្មភាពថ្មីៗដោយមានរបៀបវារៈច្បាស់លាស់' },
  ];

  // Section III: Learning activities
  const learningItems = [
    { id: 'learn1', label: '៩. ចំនួនសកម្មភាពរៀននិងការចេះធ្វើការក្នុងក្រុមសម្រាប់សិស្ស' },
    { id: 'learn2', label: '១០. សិស្សដែលដឹងនឹងស្តាប់តាមលំដាប់ដែលបានផ្ដល់នូវសំណួរដ៏មានអត្ថន័យ' },
    { id: 'learn3', label: '១១. ការជជែកវែកញែកជាមួយមិត្តរួមថ្នាក់ខណៈកំពុងធ្វើសកម្មភាពរួមគ្នា ចូលរួមនិងជួយគ្នា' },
    { id: 'learn4', label: '១២. សកម្មភាពបង្រៀនដែលមានសារៈសំខាន់សម្រាប់ជីវិតប្រចាំថ្ងៃ' },
    { id: 'learn5', label: '១៣. គ្រប់សិស្សចូលរួមក្នុងសកម្មភាពតាមក្រុម ចូលរួមនិងជួយគ្នាវិញទៅមក' },
  ];

  // Section IV: Assessment activities  
  const assessmentItems = [
    { id: 'assess1', label: '១៤. ដំណើរការពិនិត្យឡើងវិញនូវចំណេះដឹងមុន និងថ្មីរបស់សិស្ស' },
    { id: 'assess2', label: '១៥. ការពិនិត្យផ្ទៀងផ្ទាត់កម្រិតនៃការយល់ដឹងរបស់សិស្សដោយសំណួរឬសកម្មភាព និងសារៈសំខាន់' },
    { id: 'assess3', label: '១៦. មនុស្សក្រមួយរបស់ ប្រើ ផ្តល់មតិត្រឡប់ដល់សិស្សអំពីការងាររបស់ពួកគេ' },
    { id: 'assess4', label: '១៧. ប្រើសំណួរគោលនូវអ្វីដែលសិស្សត្រូវធ្វើ និងវាយតម្លៃថាគោលបំណងសម្រេចបាន' },
    { id: 'assess5', label: '១៨. ឱយដឹងចំពោះសិស្សថាធ្វើការអ្វី និងវាយតម្លៃបញ្ជាក់កម្រិតការយល់' },
    { id: 'assess6', label: '១៩. ផ្តល់នូវឱកាសឱយសិស្សរៀបរាប់អំពីអ្វីដែលបានរៀន' },
    { id: 'assess7', label: '២០. គ្រប់គ្នាឈានទៅសម្រេចតាមគោលបំណងនៃមេរៀន' },
    { id: 'assess8', label: '២១. វាយតម្លៃ អវត្តមាន គំនិតការរៀនរបស់សិស្សបំពេញកំឡុងពេលមេរៀនដោយមានបានត្រឹមត្រូវ' },
    { id: 'assess9', label: '២២. ទំនាក់ទំនងរវាងមាគម្មាណ្ឌនិងសិស្សបានច្បាស់លាស់ និងមានសុជីវធម៌' },
    { id: 'assess10', label: '២៣. គ្រប់សិស្សចូលរួមធ្វើការនិងសហការគ្នាក្នុងក្រុមឬតាមគូរជាមួយមិត្តរួមថ្នាក់របស់ពួកគេ' },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      className="observation-entry-form"
    >
      {!hideHeader && (
        <Card title="ទម្រង់វាយតម្លៃការបង្រៀននិងរៀនជំនាន់ថ្មី ២" className="mb-4">
        {/* Header Information */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="ឈ្មោះសាលារៀន"
              name="schoolName"
              rules={[{ required: true, message: 'សូមបញ្ចូលឈ្មោះសាលារៀន' }]}
            >
              <Input placeholder="ឈ្មោះសាលារៀន" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="លេខកូដសាលា"
              name="schoolCode"
              rules={[{ required: true, message: 'សូមបញ្ចូលលេខកូដសាលា' }]}
            >
              <Input placeholder="លេខកូដ" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="ភូមិ"
              name="village"
              rules={[{ required: true, message: 'សូមបញ្ចូលភូមិ' }]}
            >
              <Input placeholder="ភូមិ" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="ឃុំ/សង្កាត់"
              name="commune"
              rules={[{ required: true, message: 'សូមបញ្ចូលឃុំ/សង្កាត់' }]}
            >
              <Input placeholder="ឃុំ/សង្កាត់" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="ស្រុក/ខណ្ឌ"
              name="district"
              rules={[{ required: true, message: 'សូមបញ្ចូលស្រុក/ខណ្ឌ' }]}
            >
              <Input placeholder="ស្រុក/ខណ្ឌ" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="ខេត្ត/រាជធានី"
              name="province"
              rules={[{ required: true, message: 'សូមបញ្ចូលខេត្ត/រាជធានី' }]}
            >
              <Input placeholder="ខេត្ត/រាជធានី" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="ក្រុមសាលា"
              name="cluster"
              rules={[{ required: true, message: 'សូមបញ្ចូលក្រុមសាលា' }]}
            >
              <Input placeholder="ក្រុមសាលា" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="ឈ្មោះអ្នកសង្កេត"
              name="observerName"
              rules={[{ required: true, message: 'សូមបញ្ចូលឈ្មោះអ្នកសង្កេត' }]}
            >
              <Input placeholder="ឈ្មោះអ្នកសង្កេត" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              label="តួនាទី"
              name="observerPosition"
              rules={[{ required: true, message: 'សូមបញ្ចូលតួនាទី' }]}
            >
              <Select placeholder="ជ្រើសរើសតួនាទី">
                <Option value="principal">នាយកសាលា</Option>
                <Option value="deputy">នាយករង</Option>
                <Option value="teacher">គ្រូបង្រៀន</Option>
                <Option value="cluster_director">នាយកក្រុមសាលា</Option>
                <Option value="doe_officer">មន្ត្រីការិយាល័យអប់រំ</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              label="លេខកូដអ្នកសង្កេត"
              name="observerCode"
            >
              <Input placeholder="លេខកូដ" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              label="កាលបរិច្ឆេទសង្កេត"
              name="observationDate"
              rules={[{ required: true, message: 'សូមជ្រើសរើសកាលបរិច្ឆេទ' }]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              label="ម៉ោងចូលសង្កេត"
              name="startTime"
              rules={[{ required: true, message: 'សូមបញ្ចូលម៉ោងចាប់ផ្តើម' }]}
            >
              <Input type="time" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="ឈ្មោះគ្រូបង្រៀន"
              name="teacherName"
              rules={[{ required: true, message: 'សូមបញ្ចូលឈ្មោះគ្រូបង្រៀន' }]}
            >
              <Input placeholder="ឈ្មោះគ្រូបង្រៀន" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item
              label="លេខកូដគ្រូ"
              name="teacherCode"
            >
              <Input placeholder="លេខកូដ" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item
              label="ភេទ"
              name="teacherGender"
              rules={[{ required: true, message: 'សូមជ្រើសរើសភេទ' }]}
            >
              <Select placeholder="ភេទ">
                <Option value="M">ប្រុស</Option>
                <Option value="F">ស្រី</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={2}>
            <Form.Item
              label="ថ្នាក់ទី"
              name="grade"
              rules={[{ required: true, message: 'សូមជ្រើសរើសថ្នាក់' }]}
            >
              <Select placeholder="ថ្នាក់">
                <Option value="4">៤</Option>
                <Option value="5">៥</Option>
                <Option value="6">៦</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={2}>
            <Form.Item
              label="ក្រុម"
              name="group"
            >
              <Input placeholder="ក/ខ" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item
              label="ប្រភេទថ្នាក់"
              name="classType"
              rules={[{ required: true, message: 'សូមជ្រើសរើសប្រភេទថ្នាក់' }]}
            >
              <Select placeholder="ប្រភេទ">
                <Option value="regular">ធម្មតា</Option>
                <Option value="multigrade">ពហុកម្រិត</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item
              label="ម៉ោងបញ្ចប់"
              name="endTime"
              rules={[{ required: true, message: 'សូមបញ្ចូលម៉ោងបញ្ចប់' }]}
            >
              <Input type="time" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="មុខវិជ្ជា"
              name="subject"
              rules={[{ required: true, message: 'សូមជ្រើសរើសមុខវិជ្ជា' }]}
            >
              <Select placeholder="ជ្រើសរើសមុខវិជ្ជា">
                <Option value="khmer">ភាសាខ្មែរ</Option>
                <Option value="math">គណិតវិទ្យា</Option>
                <Option value="science">វិទ្យាសាស្ត្រ</Option>
                <Option value="social">សិក្សាសង្គម</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              label="ប្រធានបទមេរៀន"
              name="topic"
              rules={[{ required: true, message: 'សូមបញ្ចូលប្រធានបទមេរៀន' }]}
            >
              <Input placeholder="ប្រធានបទមេរៀន" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
      )}

      {/* Section I: Introduction */}
      <Card title="I. សកម្មភាពផ្តើម" className="mb-4">
        {introductionItems.map((item) => (
          <Form.Item
            key={item.id}
            label={item.label}
            name={['introductionScores', item.id]}
            rules={[{ required: true, message: 'សូមជ្រើសរើសពិន្ទុ' }]}
          >
            <Radio.Group>
              <Radio value={1}>១</Radio>
              <Radio value={2}>២</Radio>
            </Radio.Group>
          </Form.Item>
        ))}
      </Card>

      {/* Section II: Teaching Activities */}
      <Card title="II. សកម្មភាពបង្រៀន" className="mb-4">
        {teachingItems.map((item) => (
          <Form.Item
            key={item.id}
            label={item.label}
            name={['teachingScores', item.id]}
            rules={[{ required: true, message: 'សូមជ្រើសរើសពិន្ទុ' }]}
          >
            <Radio.Group>
              <Radio value={1}>១</Radio>
              <Radio value={2}>២</Radio>
            </Radio.Group>
          </Form.Item>
        ))}
      </Card>

      {/* Section III: Learning Activities */}
      <Card title="III. សកម្មភាពរៀន និងបង្រៀន" className="mb-4">
        {learningItems.map((item) => (
          <Form.Item
            key={item.id}
            label={item.label}
            name={['learningScores', item.id]}
            rules={[{ required: true, message: 'សូមជ្រើសរើសពិន្ទុ' }]}
          >
            <Radio.Group>
              <Radio value={1}>១</Radio>
              <Radio value={2}>២</Radio>
            </Radio.Group>
          </Form.Item>
        ))}
      </Card>

      {/* Section IV: Assessment */}
      <Card title="IV. ការវាយតម្លៃ" className="mb-4">
        {assessmentItems.map((item) => (
          <Form.Item
            key={item.id}
            label={item.label}
            name={['assessmentScores', item.id]}
            rules={[{ required: true, message: 'សូមជ្រើសរើសពិន្ទុ' }]}
          >
            <Radio.Group>
              <Radio value={3}>៣</Radio>
              <Radio value={2}>២</Radio>
              <Radio value={1}>១</Radio>
            </Radio.Group>
          </Form.Item>
        ))}
      </Card>

      {/* Student Count Section */}
      <Card title="ចំនួនសិស្សតាមថ្នាក់" className="mb-4">
        <Row gutter={16}>
          {[1, 2, 3, 4, 5, 6].map((grade) => (
            <Col span={8} key={grade}>
              <Card size="small" title={`ថ្នាក់ទី ${grade}`} className="mb-2">
                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item
                      label="ប្រុស"
                      name={['studentCounts', `grade${grade}`, 'male']}
                    >
                      <InputNumber min={0} placeholder="០" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="ស្រី"
                      name={['studentCounts', `grade${grade}`, 'female']}
                    >
                      <InputNumber min={0} placeholder="០" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Attendance Section */}
      <Card title="ការមកសិក្សា" className="mb-4">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="ចំនួនសិស្សសរុប"
              name="totalStudents"
              rules={[{ required: true, message: 'សូមបញ្ចូលចំនួនសិស្សសរុប' }]}
            >
              <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="មកសិក្សា"
              name="presentStudents"
              rules={[{ required: true, message: 'សូមបញ្ចូលចំនួនសិស្សមកសិក្សា' }]}
            >
              <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="អវត្តមាន"
              name="absentStudents"
              rules={[{ required: true, message: 'សូមបញ្ចូលចំនួនសិស្សអវត្តមាន' }]}
            >
              <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Comments and Improvement Plans Section */}
      <Card title="III. ការសន្និដ្ឋាន" className="mb-4">
        <Form.Item
          label="១. សេចក្តីសន្និដ្ឋានរបស់អ្នកសង្កេត ពី កំណុចខ្លាំង និងកំណុចដែលត្រូវកែលម្អ"
          name="comments"
        >
          <TextArea
            rows={4}
            placeholder="សរសេរសេចក្តីសន្និដ្ឋានរបស់អ្នក..."
          />
        </Form.Item>
        
        <Form.Item
          label="២. សេចក្តីសន្និដ្ឋានរបស់គ្រូបង្រៀនអំពីមេរៀនដែលទើបធ្វើការ និងអ្វីដែលត្រូវកែលម្អ"
          name="teachingImprovements"
        >
          <TextArea
            rows={3}
            placeholder="សរសេរការកែលម្អសម្រាប់គ្រូបង្រៀន..."
          />
        </Form.Item>

        <Divider>III. យោបល់សំរាប់កិច្ចការ</Divider>
        
        <Form.Item
          label="ក. លោកនាយក/នាយិកា"
          name="principalSupport"
        >
          <TextArea
            rows={3}
            placeholder="យោបល់សម្រាប់នាយកសាលា..."
          />
        </Form.Item>
        
        <Form.Item
          label="ខ. គ្រូបង្គោល"
          name="clusterSupport"
        >
          <TextArea
            rows={3}
            placeholder="យោបល់សម្រាប់គ្រូបង្គោល..."
          />
        </Form.Item>
      </Card>

      {/* Signature Section */}
      <Card title="ហត្ថលេខា" className="mb-4">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="ហត្ថលេខាអ្នកសង្កេត"
              name="observerSignature"
            >
              <Input placeholder="ហត្ថលេខា" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="ហត្ថលេខាគ្រូបង្រៀន"
              name="teacherSignature"
            >
              <Input placeholder="ហត្ថលេខា" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Form Actions */}
      <Row gutter={16}>
        <Col span={12}>
          <Button
            type="default"
            icon={<SaveOutlined />}
            onClick={handleSaveDraft}
            block
          >
            រក្សាទុកជាព្រាង
          </Button>
        </Col>
        <Col span={12}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            htmlType="submit"
            loading={loading}
            block
          >
            ដាក់ស្នើ
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default ObservationEntryForm;
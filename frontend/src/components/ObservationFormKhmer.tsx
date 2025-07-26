import React, { useState, useRef } from 'react';
import { Form, Input, DatePicker, Row, Col, Card, Typography, Space, Button, message } from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';
import './ObservationFormKhmer.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

const ObservationFormKhmer: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const teacherSigRef = useRef<SignatureCanvas>(null);
  const advisorSigRef = useRef<SignatureCanvas>(null);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      
      // Get signatures
      const teacherSignature = teacherSigRef.current?.isEmpty() ? null : teacherSigRef.current?.toDataURL();
      const advisorSignature = advisorSigRef.current?.isEmpty() ? null : advisorSigRef.current?.toDataURL();
      
      // Format dates
      const formData = {
        ...values,
        consultationDate: values.consultationDate ? values.consultationDate.format('YYYY-MM-DD') : null,
        activityDate1: values.activityDate1 ? values.activityDate1.format('YYYY-MM-DD') : null,
        activityDate2: values.activityDate2 ? values.activityDate2.format('YYYY-MM-DD') : null,
        advisorSignatureDate: values.advisorSignatureDate ? values.advisorSignatureDate.format('YYYY-MM-DD') : null,
        teacherSignatureDate: values.teacherSignatureDate ? values.teacherSignatureDate.format('YYYY-MM-DD') : null,
        teacherSignature,
        advisorSignature,
      };

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/observation-khmer', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      message.success('ទំរង់ត្រូវបានរក្សាទុកដោយជោគជ័យ');
      form.resetFields();
      teacherSigRef.current?.clear();
      advisorSigRef.current?.clear();
    } catch (error) {
      console.error('Error saving form:', error);
      message.error('មានកំហុសក្នុងការរក្សាទុកទំរង់');
    } finally {
      setLoading(false);
    }
  };

  const clearTeacherSignature = () => {
    teacherSigRef.current?.clear();
  };

  const clearAdvisorSignature = () => {
    advisorSigRef.current?.clear();
  };

  return (
    <Card style={{ margin: 0 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ width: '100%' }}
      >
        <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          ទំរង់ការវាយតម្លៃការបង្រៀននិងរៀន
        </Title>

        <div style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="ឈ្មោះសាលារៀន" name="schoolName" style={{ marginBottom: 24 }}>
                <Input placeholder="បញ្ចូលឈ្មោះសាលារៀន" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="ឈ្មោះទីប្រឹក្សាគោលពហុប្រាសាណ៍រៀន" name="advisorName" style={{ marginBottom: 24 }}>
                <Input placeholder="បញ្ចូលឈ្មោះទីប្រឹក្សា" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="ឈ្មោះគ្រូបង្រៀន" name="teacherName" style={{ marginBottom: 24 }}>
                <Input placeholder="បញ្ចូលឈ្មោះគ្រូបង្រៀន" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="កាលបរិច្ឆេទទីប្រឹក្សាគោលពហុប្រាសាណ៍មាត់ចុះផ្ទាល់ទីប្រឹក្សាគោលពហុ" name="consultationDate" style={{ marginBottom: 24 }}>
                <DatePicker style={{ width: '100%' }} placeholder="ជ្រើសរើសកាលបរិច្ឆេទ" size="large" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Form.Item label="គោលដៅគ្រូនិងសកម្មភាព" name="teacherGoalsActivities" style={{ marginBottom: 24 }}>
          <TextArea rows={3} placeholder="បញ្ចូលគោលដៅគ្រូនិងសកម្មភាព" size="large" />
        </Form.Item>

        <Form.Item label="យុទ្ធសាស្រ្តដាក់សាកល្បង" name="strategy" style={{ marginBottom: 24 }}>
          <TextArea rows={2} placeholder="បញ្ចូលយុទ្ធសាស្រ្តដាក់សាកល្បង" size="large" />
        </Form.Item>

        <Title level={4} style={{ marginTop: 32, marginBottom: 24 }}>គម្រោងពេលវេលា</Title>
        
        <div style={{ backgroundColor: '#fafafa', padding: 24, borderRadius: 8, marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="ទី១...ដល់...ម៉ោង" name="time1" style={{ marginBottom: 24 }}>
                <Input placeholder="ឧទាហរណ៍: ២០...ដល់ទី១..." size="large" />
              </Form.Item>
              <Form.Item label="ទី២...ដល់ទី២០..." name="time2" style={{ marginBottom: 0 }}>
                <Input placeholder="បញ្ចូលពេលវេលា" size="large" />
              </Form.Item>
            </Col>
            <Col span={9}>
              <Form.Item label="ថ្ងៃសកម្មភាពបាទទាន់ម៉ោង" name="activityDate1" style={{ marginBottom: 24 }}>
                <DatePicker style={{ width: '100%' }} size="large" />
              </Form.Item>
              <Form.Item label="គម្រោងពេលវេលាវែកស្រមុល (កាលបរិច្ឆេទ)" name="planDate1" style={{ marginBottom: 0 }}>
                <Input placeholder="បញ្ចូលកាលបរិច្ឆេទ" size="large" />
              </Form.Item>
            </Col>
            <Col span={9}>
              <Form.Item label="ថ្ងៃសកម្មភាពបាទទាន់ម៉ោង" name="activityDate2" style={{ marginBottom: 24 }}>
                <DatePicker style={{ width: '100%' }} size="large" />
              </Form.Item>
              <Form.Item label="គម្រោងពេលវេលាវែកស្រមុល (កាលបរិច្ឆេទ)" name="planDate2" style={{ marginBottom: 0 }}>
                <Input placeholder="បញ្ចូលកាលបរិច្ឆេទ" size="large" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Form.Item label="ម៉ោយតែវិមុលន៍ចំប្រព័ន្ធតុប្រាសល់" name="evaluationSystem" style={{ marginBottom: 24 }}>
          <TextArea rows={4} placeholder="បញ្ចូលការវាយតម្លៃ" size="large" />
        </Form.Item>

        <Form.Item label="យោបល់របស់គ្រូ" name="teacherComments" style={{ marginBottom: 32 }}>
          <TextArea rows={4} placeholder="បញ្ចូលយោបល់របស់គ្រូ" size="large" />
        </Form.Item>

        <Row gutter={32} style={{ marginTop: 32 }}>
          <Col span={12}>
            <Card title="ហត្ថលេខាគ្រូបង្រៀន" size="small">
              <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, marginBottom: 16 }}>
                <SignatureCanvas
                  ref={teacherSigRef}
                  canvasProps={{
                    width: 400,
                    height: 150,
                    className: 'signature-canvas'
                  }}
                />
              </div>
              <Button size="small" onClick={clearTeacherSignature} style={{ marginBottom: 16 }}>សម្អាតហត្ថលេខា</Button>
              <Form.Item label="លេខទូរស័ព្ទ" name="teacherPhone">
                <Input placeholder="បញ្ចូលលេខទូរស័ព្ទ" />
              </Form.Item>
              <Form.Item label="កាលបរិច្ឆេទ" name="teacherSignatureDate">
                <DatePicker style={{ width: '100%' }} placeholder="ជ្រើសរើសកាលបរិច្ឆេទ" />
              </Form.Item>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="ហត្ថលេខាទីប្រឹក្សាគោលពហុ" size="small">
              <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, marginBottom: 16 }}>
                <SignatureCanvas
                  ref={advisorSigRef}
                  canvasProps={{
                    width: 400,
                    height: 150,
                    className: 'signature-canvas'
                  }}
                />
              </div>
              <Button size="small" onClick={clearAdvisorSignature} style={{ marginBottom: 16 }}>សម្អាតហត្ថលេខា</Button>
              <Form.Item label="លេខទូរស័ព្ទ" name="advisorPhone">
                <Input placeholder="បញ្ចូលលេខទូរស័ព្ទ" />
              </Form.Item>
              <Form.Item label="កាលបរិច្ឆេទ" name="advisorSignatureDate">
                <DatePicker style={{ width: '100%' }} placeholder="ជ្រើសរើសកាលបរិច្ឆេទ" />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <Form.Item style={{ marginTop: 32, textAlign: 'center' }}>
          <Space>
            <Button type="primary" htmlType="submit" size="large" loading={loading}>
              រក្សាទុក
            </Button>
            <Button size="large" onClick={() => form.resetFields()} disabled={loading}>
              សម្អាត
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ObservationFormKhmer;
import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Switch,
  Select,
  Form,
  Divider,
  Row,
  Col,
  Modal,
  Input,
  InputNumber,
  App,
  Tabs,
  Avatar,
  Upload,
  DatePicker,
  message as antMessage,
  TimePicker,
  Tag,
  Checkbox,
  Table,
  Badge,
  Alert,
  Drawer,
  Radio,
  Progress,
  Tooltip,
} from 'antd';
import {
  BellOutlined,
  LockOutlined,
  BgColorsOutlined,
  GlobalOutlined,
  SaveOutlined,
  UndoOutlined,
  KeyOutlined,
  SafetyOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CameraOutlined,
  PhoneOutlined,
  HomeOutlined,
  TeamOutlined,
  BankOutlined,
  BookOutlined,
  TrophyOutlined,
  PlusOutlined,
  DeleteOutlined,
  SettingOutlined,
  MailOutlined,
  MessageOutlined,
  MobileOutlined,
  EditOutlined,
  FileProtectOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  IdcardOutlined,
  SolutionOutlined,
  ApiOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  ExportOutlined,
  NotificationOutlined,
  AlertOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  FolderOpenOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  QrcodeOutlined,
  CopyOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { EnhancedLocationPicker } from '../components/EnhancedLocationPicker';
import { userService } from '../services/user.service';
import { notificationService } from '../services/notification.service';
import { sendTestNotification } from '../utils/notificationHelpers';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea, Password } = Input;
const { RangePicker } = DatePicker;

// Interfaces
interface FamilyMember {
  id?: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  occupation?: string;
}

interface WorkExperience {
  id?: string;
  position: string;
  organization: string;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  description?: string;
}

interface Education {
  id?: string;
  degree: string;
  institution: string;
  fieldOfStudy: string;
  graduationYear: number;
}

interface VocationalTraining {
  id?: string;
  courseName: string;
  institution: string;
  completionDate: Dayjs | null;
  certificate?: string;
}

interface EmergencyContact {
  id?: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  alternativePhone?: string;
  address?: string;
}

interface TeachingSubject {
  id?: string;
  subject: string;
  grade: string;
  yearsTeaching: number;
}

interface Certification {
  id?: string;
  name: string;
  issuingOrganization: string;
  issueDate: Dayjs | null;
  expiryDate: Dayjs | null;
  certificateNumber?: string;
}

interface OfficeHours {
  day: string;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
  available: boolean;
}

interface NotificationPreferences {
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    types: string[];
  };
  sms: {
    enabled: boolean;
    types: string[];
  };
  inApp: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
}

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, setUser } = useAuth();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  const [imageUrl, setImageUrl] = useState<string>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [signatureDrawerVisible, setSignatureDrawerVisible] = useState(false);
  const [twoFactorModalVisible, setTwoFactorModalVisible] = useState(false);
  const [apiTokensModalVisible, setApiTokensModalVisible] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string>();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>();
  const [verificationCode, setVerificationCode] = useState('');
  const [apiTokens, setApiTokens] = useState<any[]>([]);

  // Determine user role
  const userRole = user?.role?.name || 'Teacher';

  // Office hours default data
  const defaultOfficeHours: OfficeHours[] = [
    { day: 'ច័ន្ទ', startTime: dayjs('08:00', 'HH:mm'), endTime: dayjs('17:00', 'HH:mm'), available: true },
    { day: 'អង្គារ', startTime: dayjs('08:00', 'HH:mm'), endTime: dayjs('17:00', 'HH:mm'), available: true },
    { day: 'ពុធ', startTime: dayjs('08:00', 'HH:mm'), endTime: dayjs('17:00', 'HH:mm'), available: true },
    { day: 'ព្រហស្បតិ៍', startTime: dayjs('08:00', 'HH:mm'), endTime: dayjs('17:00', 'HH:mm'), available: true },
    { day: 'សុក្រ', startTime: dayjs('08:00', 'HH:mm'), endTime: dayjs('17:00', 'HH:mm'), available: true },
    { day: 'សៅរ៍', startTime: null, endTime: null, available: false },
    { day: 'អាទិត្យ', startTime: null, endTime: null, available: false },
  ];

  // Load saved settings and user data
  useEffect(() => {
    if (user) {
      // Set profile picture
      if (user.profilePicture) {
        setImageUrl(user.profilePicture);
        setFileList([{
          uid: '-1',
          name: 'profile.png',
          status: 'done',
          url: user.profilePicture,
        }]);
      }

      // Set form values
      form.setFieldsValue({
        // Basic Information
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        bio: user.bio,
        
        // Settings
        language: localStorage.getItem('language') || 'km',
        theme: (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'light',
        pushNotifications: localStorage.getItem('pushNotifications') === 'true',
        emailNotifications: localStorage.getItem('emailNotifications') === 'true',
        
        // Office Location
        officeLocation: user.officeLocation || '',
        officeLatitude: user.officeLatitude || null,
        officeLongitude: user.officeLongitude || null,

        // Office Hours
        officeHours: defaultOfficeHours,

        // Notification Preferences
        notificationPreferences: {
          email: {
            enabled: true,
            frequency: 'immediate',
            types: ['mission', 'observation', 'approval', 'reminder'],
          },
          sms: {
            enabled: false,
            types: ['urgent', 'approval'],
          },
          inApp: {
            enabled: true,
            sound: true,
            desktop: false,
          },
        },
      });
    }
  }, [form, user]);

  const handleImageUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('file', file as Blob);

    try {
      // TODO: Replace with actual upload API
      // const response = await userService.uploadProfilePicture(formData);
      // setImageUrl(response.data.url);
      
      // For demo, use local URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setImageUrl(url);
        if (onSuccess) onSuccess({ url });
      };
      reader.readAsDataURL(file as Blob);
      
      antMessage.success('រូបភាពបានផ្ទុកឡើងដោយជោគជ័យ');
    } catch (error) {
      if (onError) onError(error as Error);
      antMessage.error('មិនអាចផ្ទុករូបភាពបានទេ');
    }
  };

  const uploadButton = (
    <div>
      <CameraOutlined style={{ fontSize: 24 }} />
      <div style={{ marginTop: 8 }}>ផ្ទុករូបភាព</div>
    </div>
  );

  const handleSaveBasicInfo = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Save to backend
      if (user?.id) {
        await userService.updateUser(user.id, {
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          bio: values.bio,
          profilePicture: imageUrl,
          // Family members
          familyMembers: values.familyMembers,
          // Emergency contacts
          emergencyContacts: values.emergencyContacts,
          // Work experience
          workExperiences: values.workExperiences,
          // Education
          educations: values.educations,
          // Vocational training
          vocationalTrainings: values.vocationalTrainings,
          // Office hours
          officeHours: values.officeHours,
          // Notification preferences
          notificationPreferences: values.notificationPreferences,
          // Teacher specific
          teachingSubjects: values.teachingSubjects,
          certifications: values.certifications,
          // Director specific
          schoolInfo: values.schoolInfo,
          delegationSettings: values.delegationSettings,
          // Regional specific
          jurisdiction: values.jurisdiction,
          reportPreferences: values.reportPreferences,
        });

        // Update local user state
        setUser({
          ...user,
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          bio: values.bio,
          profilePicture: imageUrl,
        });

        // Update localStorage
        localStorage.setItem('user', JSON.stringify({
          ...user,
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          bio: values.bio,
          profilePicture: imageUrl,
        }));
      }

      message.success('ការកំណត់បានរក្សាទុកដោយជោគជ័យ');
    } catch (error) {
      message.error('មិនអាចរក្សាទុកការកំណត់បានទេ');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      setLoading(true);
      // TODO: Implement password change API
      await userService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      
      message.success('ពាក្យសម្ងាត់បានផ្លាស់ប្តូរដោយជោគជ័យ');
      setChangePasswordVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error('មិនអាចផ្លាស់ប្តូរពាក្យសម្ងាត់បានទេ');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      // TODO: Generate QR code from backend
      setQrCodeUrl('/api/2fa/qrcode'); // Mock URL
      setTwoFactorModalVisible(true);
    } catch (error) {
      message.error('មិនអាចបើកការផ្ទៀងផ្ទាត់ពីរជំហានបានទេ');
    }
  };

  const handleVerify2FA = async () => {
    try {
      // TODO: Verify 2FA code with backend
      if (verificationCode === '123456') { // Mock verification
        message.success('ការផ្ទៀងផ្ទាត់ពីរជំហានបានបើកដោយជោគជ័យ');
        setTwoFactorModalVisible(false);
        setVerificationCode('');
      } else {
        message.error('លេខកូដផ្ទៀងផ្ទាត់មិនត្រឹមត្រូវ');
      }
    } catch (error) {
      message.error('មិនអាចផ្ទៀងផ្ទាត់លេខកូដបានទេ');
    }
  };

  const handleGenerateApiToken = async () => {
    try {
      // TODO: Generate API token from backend
      const newToken = {
        id: Date.now(),
        name: 'API Token ' + (apiTokens.length + 1),
        token: 'tok_' + Math.random().toString(36).substring(2, 15),
        createdAt: new Date().toISOString(),
        lastUsed: null,
      };
      setApiTokens([...apiTokens, newToken]);
      message.success('API Token បានបង្កើតដោយជោគជ័យ');
    } catch (error) {
      message.error('មិនអាចបង្កើត API Token បានទេ');
    }
  };

  const handleTestNotification = async (type: 'email' | 'sms' | 'push') => {
    try {
      if (type === 'push') {
        // Request permission first if needed
        const permission = await notificationService.requestPermission();
        if (!permission && Notification.permission !== 'granted') {
          message.warning('សូមអនុញ្ញាតការជូនដំណឹងក្នុងកម្មវិធីរុករករបស់អ្នក');
          return;
        }
        // Send test push notification
        sendTestNotification();
        message.success('ការជូនដំណឹងសាកល្បងត្រូវបានផ្ញើ');
      } else {
        // Send test email or SMS via API
        await notificationService.testNotification(type);
        message.success(`${type === 'email' ? 'អ៊ីមែល' : 'SMS'} សាកល្បងត្រូវបានផ្ញើ`);
      }
    } catch (error) {
      message.error(`មិនអាចផ្ញើ${type === 'email' ? 'អ៊ីមែល' : type === 'sms' ? 'SMS' : 'ការជូនដំណឹង'}សាកល្បងបានទេ`);
    }
  };

  const renderBasicInfoTab = () => (
    <>
      <Row gutter={24}>
        <Col xs={24} md={8} style={{ textAlign: 'center' }}>
          <Form.Item>
            <Upload
              name="avatar"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              customRequest={handleImageUpload}
              beforeUpload={(file) => {
                const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
                if (!isJpgOrPng) {
                  message.error('អ្នកអាចផ្ទុកតែឯកសារ JPG/PNG ប៉ុណ្ណោះ!');
                }
                const isLt2M = file.size / 1024 / 1024 < 2;
                if (!isLt2M) {
                  message.error('រូបភាពត្រូវតែតូចជាង 2MB!');
                }
                return isJpgOrPng && isLt2M;
              }}
            >
              {imageUrl ? (
                <Avatar 
                  src={imageUrl} 
                  alt="avatar" 
                  style={{ width: '100%', height: '100%' }}
                  size={100}
                />
              ) : (
                uploadButton
              )}
            </Upload>
          </Form.Item>
          <Text type="secondary">ចុចដើម្បីផ្លាស់ប្តូររូបភាព</Text>
          
          <Divider />
          
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              icon={<EditOutlined />}
              onClick={() => setSignatureDrawerVisible(true)}
              block
            >
              {signatureUrl ? 'កែប្រែហត្ថលេខា' : 'បន្ថែមហត្ថលេខា'}
            </Button>
            {signatureUrl && (
              <img 
                src={signatureUrl} 
                alt="signature" 
                style={{ maxWidth: '100%', border: '1px solid #d9d9d9', borderRadius: 4 }}
              />
            )}
          </Space>
        </Col>

        <Col xs={24} md={16}>
          <Form.Item
            name="fullName"
            label="ឈ្មោះពេញ"
            rules={[{ required: true, message: 'សូមបញ្ចូលឈ្មោះពេញ' }]}
          >
            <Input size="large" prefix={<UserOutlined />} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="អ៊ីមែល"
                rules={[
                  { required: true, message: 'សូមបញ្ចូលអ៊ីមែល' },
                  { type: 'email', message: 'អ៊ីមែលមិនត្រឹមត្រូវ' }
                ]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="phoneNumber"
                label="លេខទូរស័ព្ទ"
                rules={[{ required: true, message: 'សូមបញ្ចូលលេខទូរស័ព្ទ' }]}
              >
                <Input size="large" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="bio"
            label="ប្រវត្តិរូបសង្ខេប"
          >
            <TextArea rows={3} placeholder="សរសេរអំពីខ្លួនអ្នក..." />
          </Form.Item>
        </Col>
      </Row>

      <Divider>សមាជិកគ្រួសារ</Divider>

      <Form.List name="familyMembers">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Card key={key} size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col xs={24} md={6}>
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      label="ឈ្មោះ"
                      rules={[{ required: true, message: 'សូមបញ្ចូលឈ្មោះ' }]}
                    >
                      <Input placeholder="ឈ្មោះសមាជិក" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      {...restField}
                      name={[name, 'relationship']}
                      label="ទំនាក់ទំនង"
                      rules={[{ required: true, message: 'សូមបញ្ចូលទំនាក់ទំនង' }]}
                    >
                      <Select placeholder="ជ្រើសរើស">
                        <Option value="ឪពុក">ឪពុក</Option>
                        <Option value="ម្តាយ">ម្តាយ</Option>
                        <Option value="ប្តី/ប្រពន្ធ">ប្តី/ប្រពន្ធ</Option>
                        <Option value="កូនប្រុស">កូនប្រុស</Option>
                        <Option value="កូនស្រី">កូនស្រី</Option>
                        <Option value="បងប្អូន">បងប្អូន</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      {...restField}
                      name={[name, 'phoneNumber']}
                      label="លេខទូរស័ព្ទ"
                    >
                      <Input placeholder="លេខទូរស័ព្ទ" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={5}>
                    <Form.Item
                      {...restField}
                      name={[name, 'occupation']}
                      label="មុខរបរ"
                    >
                      <Input placeholder="មុខរបរ" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={1}>
                    <Form.Item label=" ">
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(name)}
                        icon={<DeleteOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                បន្ថែមសមាជិកគ្រួសារ
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Divider>ទំនាក់ទំនងពេលអាសន្ន</Divider>

      <Form.List name="emergencyContacts">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Card key={key} size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col xs={24} md={6}>
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      label="ឈ្មោះ"
                      rules={[{ required: true, message: 'សូមបញ្ចូលឈ្មោះ' }]}
                    >
                      <Input placeholder="ឈ្មោះអ្នកទំនាក់ទំនង" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={4}>
                    <Form.Item
                      {...restField}
                      name={[name, 'relationship']}
                      label="ទំនាក់ទំនង"
                      rules={[{ required: true, message: 'សូមបញ្ចូលទំនាក់ទំនង' }]}
                    >
                      <Input placeholder="ទំនាក់ទំនង" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={4}>
                    <Form.Item
                      {...restField}
                      name={[name, 'phoneNumber']}
                      label="ទូរស័ព្ទចម្បង"
                      rules={[{ required: true, message: 'សូមបញ្ចូលលេខទូរស័ព្ទ' }]}
                    >
                      <Input placeholder="លេខទូរស័ព្ទ" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={4}>
                    <Form.Item
                      {...restField}
                      name={[name, 'alternativePhone']}
                      label="ទូរស័ព្ទបម្រុង"
                    >
                      <Input placeholder="លេខទូរស័ព្ទបម្រុង" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={5}>
                    <Form.Item
                      {...restField}
                      name={[name, 'address']}
                      label="អាសយដ្ឋាន"
                    >
                      <Input placeholder="អាសយដ្ឋាន" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={1}>
                    <Form.Item label=" ">
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(name)}
                        icon={<DeleteOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<AlertOutlined />}>
                បន្ថែមទំនាក់ទំនងពេលអាសន្ន
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </>
  );

  const renderSecurityTab = () => (
    <>
      <Card title="សុវត្ថិភាពគណនី" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={16} align="middle">
            <Col span={18}>
              <Space direction="vertical" size="small">
                <Text strong>ពាក្យសម្ងាត់</Text>
                <Text type="secondary">ពាក្យសម្ងាត់បានប្តូរចុងក្រោយ៖ ៣ ខែមុន</Text>
              </Space>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Button 
                icon={<KeyOutlined />}
                onClick={() => setChangePasswordVisible(true)}
              >
                ប្តូរពាក្យសម្ងាត់
              </Button>
            </Col>
          </Row>

          <Divider />

          <Row gutter={16} align="middle">
            <Col span={18}>
              <Space direction="vertical" size="small">
                <Text strong>ការផ្ទៀងផ្ទាត់ពីរជំហាន (2FA)</Text>
                <Text type="secondary">បង្កើនសុវត្ថិភាពគណនីរបស់អ្នក</Text>
              </Space>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Switch 
                checkedChildren="បើក" 
                unCheckedChildren="បិទ"
                onChange={(checked) => {
                  if (checked) handleEnable2FA();
                }}
              />
            </Col>
          </Row>

          <Divider />

          <Row gutter={16} align="middle">
            <Col span={18}>
              <Space direction="vertical" size="small">
                <Text strong>សម័យចូលប្រើដែលសកម្ម</Text>
                <Badge status="success" text="Windows - Chrome (Current)" />
                <Badge status="default" text="Android - App (Yesterday)" />
                <Badge status="default" text="iPhone - Safari (2 days ago)" />
              </Space>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Button type="link">មើលទាំងអស់</Button>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card title="API Tokens" extra={<Button icon={<ApiOutlined />} onClick={() => setApiTokensModalVisible(true)}>គ្រប់គ្រង Tokens</Button>}>
        <Alert
          message="API tokens អនុញ្ញាតឱ្យកម្មវិធីភាគីទីបីចូលប្រើទិន្នន័យរបស់អ្នក"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Text type="secondary">អ្នកមាន {apiTokens.length} API tokens សកម្ម</Text>
      </Card>
    </>
  );

  const renderNotificationTab = () => (
    <>
      <Card title="ការជូនដំណឹងតាមអ៊ីមែល" style={{ marginBottom: 16 }}>
        <Form.Item name={['notificationPreferences', 'email', 'enabled']} valuePropName="checked">
          <Switch checkedChildren="បើក" unCheckedChildren="បិទ" />
        </Form.Item>
        
        <Form.Item 
          name={['notificationPreferences', 'email', 'frequency']} 
          label="ភាពញឹកញាប់"
          style={{ marginTop: 16 }}
        >
          <Radio.Group>
            <Radio value="immediate">ភ្លាមៗ</Radio>
            <Radio value="daily">ប្រចាំថ្ងៃ</Radio>
            <Radio value="weekly">ប្រចាំសប្តាហ៍</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item 
          name={['notificationPreferences', 'email', 'types']} 
          label="ប្រភេទការជូនដំណឹង"
        >
          <Checkbox.Group>
            <Row gutter={[16, 16]}>
              <Col span={12}><Checkbox value="mission">បេសកកម្មថ្មី</Checkbox></Col>
              <Col span={12}><Checkbox value="observation">ការសង្កេតថ្មី</Checkbox></Col>
              <Col span={12}><Checkbox value="approval">ការអនុម័ត</Checkbox></Col>
              <Col span={12}><Checkbox value="reminder">ការរំលឹក</Checkbox></Col>
              <Col span={12}><Checkbox value="report">របាយការណ៍</Checkbox></Col>
              <Col span={12}><Checkbox value="announcement">សេចក្តីប្រកាស</Checkbox></Col>
            </Row>
          </Checkbox.Group>
        </Form.Item>
      </Card>

      <Card title="ការជូនដំណឹងតាម SMS" style={{ marginBottom: 16 }}>
        <Form.Item name={['notificationPreferences', 'sms', 'enabled']} valuePropName="checked">
          <Switch checkedChildren="បើក" unCheckedChildren="បិទ" />
        </Form.Item>
        
        <Form.Item 
          name={['notificationPreferences', 'sms', 'types']} 
          label="ប្រភេទការជូនដំណឹង"
          style={{ marginTop: 16 }}
        >
          <Checkbox.Group>
            <Row gutter={[16, 16]}>
              <Col span={12}><Checkbox value="urgent">ការជូនដំណឹងបន្ទាន់</Checkbox></Col>
              <Col span={12}><Checkbox value="approval">ការអនុម័តសំខាន់</Checkbox></Col>
              <Col span={12}><Checkbox value="deadline">កាលបរិច្ឆេទផុតកំណត់</Checkbox></Col>
            </Row>
          </Checkbox.Group>
        </Form.Item>
      </Card>

      <Card title="ការជូនដំណឹងក្នុងកម្មវិធី">
        <Form.Item name={['notificationPreferences', 'inApp', 'enabled']} valuePropName="checked">
          <Switch checkedChildren="បើក" unCheckedChildren="បិទ" />
        </Form.Item>
        
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Form.Item name={['notificationPreferences', 'inApp', 'sound']} valuePropName="checked">
              <Checkbox>សំឡេងជូនដំណឹង</Checkbox>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['notificationPreferences', 'inApp', 'desktop']} valuePropName="checked">
              <Checkbox>ការជូនដំណឹងលើកុំព្យូទ័រ</Checkbox>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="សាកល្បងការជូនដំណឹង" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="សាកល្បងប្រព័ន្ធការជូនដំណឹង"
            description="ចុចប៊ូតុងខាងក្រោមដើម្បីសាកល្បងការជូនដំណឹងតាមប្រភេទផ្សេងៗ"
            type="info"
            showIcon
          />
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Button 
                onClick={() => handleTestNotification('email')}
                icon={<MailOutlined />}
                block
              >
                សាកល្បងអ៊ីមែល
              </Button>
            </Col>
            <Col span={8}>
              <Button 
                onClick={() => handleTestNotification('sms')}
                icon={<MobileOutlined />}
                block
              >
                សាកល្បង SMS
              </Button>
            </Col>
            <Col span={8}>
              <Button 
                onClick={() => handleTestNotification('push')}
                icon={<BellOutlined />}
                block
              >
                សាកល្បងការជូនដំណឹង
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>
    </>
  );

  const renderAvailabilityTab = () => (
    <>
      <Card title="ម៉ោងការិយាល័យ" style={{ marginBottom: 16 }}>
        <Form.List name="officeHours">
          {(fields) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={16} align="middle" style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Form.Item {...restField} name={[name, 'day']}>
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col span={5}>
                    <Form.Item {...restField} name={[name, 'available']} valuePropName="checked">
                      <Switch checkedChildren="បើក" unCheckedChildren="បិទ" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item {...restField} name={[name, 'startTime']}>
                      <TimePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={1} style={{ textAlign: 'center' }}>
                    <Text>ដល់</Text>
                  </Col>
                  <Col span={6}>
                    <Form.Item {...restField} name={[name, 'endTime']}>
                      <TimePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              ))}
            </>
          )}
        </Form.List>
      </Card>

      <Card title="កាលវិភាគវិស្សមកាល">
        <Form.Item name="vacationDates" label="កាលបរិច្ឆេទវិស្សមកាល">
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="vacationNote" label="កំណត់ចំណាំ">
          <TextArea rows={3} placeholder="ហេតុផលឬព័ត៌មានបន្ថែម..." />
        </Form.Item>
      </Card>
    </>
  );

  const renderTeacherSpecificTab = () => (
    <>
      <Card title="មុខវិជ្ជាបង្រៀន" style={{ marginBottom: 16 }}>
        <Form.List name="teachingSubjects">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={16} align="middle">
                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[name, 'subject']}
                      label="មុខវិជ្ជា"
                      rules={[{ required: true, message: 'សូមបញ្ចូលមុខវិជ្ជា' }]}
                    >
                      <Input placeholder="ឧ. គណិតវិទ្យា" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      {...restField}
                      name={[name, 'grade']}
                      label="ថ្នាក់"
                      rules={[{ required: true, message: 'សូមបញ្ចូលថ្នាក់' }]}
                    >
                      <Input placeholder="ឧ. ថ្នាក់ទី៧" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      {...restField}
                      name={[name, 'yearsTeaching']}
                      label="ចំនួនឆ្នាំបង្រៀន"
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Button
                      type="text"
                      danger
                      onClick={() => remove(name)}
                      icon={<DeleteOutlined />}
                    />
                  </Col>
                </Row>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  បន្ថែមមុខវិជ្ជា
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      <Card title="វិញ្ញាបនបត្រ និងការបណ្តុះបណ្តាល">
        <Form.List name="certifications">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card key={key} size="small" style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        label="ឈ្មោះវិញ្ញាបនបត្រ"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="ឧ. វិញ្ញាបនបត្រគរុកោសល្យ" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'issuingOrganization']}
                        label="ស្ថាប័នផ្តល់"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="ឧ. ក្រសួងអប់រំ" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'issueDate']}
                        label="កាលបរិច្ឆេទចេញ"
                      >
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'expiryDate']}
                        label="កាលបរិច្ឆេទផុតកំណត់"
                      >
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={7}>
                      <Form.Item
                        {...restField}
                        name={[name, 'certificateNumber']}
                        label="លេខវិញ្ញាបនបត្រ"
                      >
                        <Input placeholder="លេខ" />
                      </Form.Item>
                    </Col>
                    <Col span={1}>
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(name)}
                        icon={<DeleteOutlined />}
                      />
                    </Col>
                  </Row>
                </Card>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<SafetyCertificateOutlined />}>
                  បន្ថែមវិញ្ញាបនបត្រ
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      <Card title="គោលដៅអភិវឌ្ឍន៍វិជ្ជាជីវៈ">
        <Form.Item name="professionalGoals" label="គោលដៅរយៈពេលខ្លី (១ឆ្នាំ)">
          <TextArea rows={2} placeholder="សរសេរគោលដៅរបស់អ្នក..." />
        </Form.Item>
        <Form.Item name="professionalGoalsLongTerm" label="គោលដៅរយៈពេលវែង (៣-៥ឆ្នាំ)">
          <TextArea rows={2} placeholder="សរសេរគោលដៅរបស់អ្នក..." />
        </Form.Item>
      </Card>
    </>
  );

  const renderDirectorSpecificTab = () => (
    <>
      <Card title="ព័ត៌មានសាលា" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name={['schoolInfo', 'name']} label="ឈ្មោះសាលា">
              <Input placeholder="ឈ្មោះសាលា" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['schoolInfo', 'code']} label="លេខកូដសាលា">
              <Input placeholder="លេខកូដ" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['schoolInfo', 'totalStudents']} label="ចំនួនសិស្សសរុប">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['schoolInfo', 'totalTeachers']} label="ចំនួនគ្រូសរុប">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['schoolInfo', 'totalClasses']} label="ចំនួនថ្នាក់សរុប">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="ការកំណត់តំណែងជំនួស" style={{ marginBottom: 16 }}>
        <Form.Item name={['delegationSettings', 'deputyDirector']} label="នាយករងជំនួស">
          <Select placeholder="ជ្រើសរើសនាយករង">
            <Option value="1">លោក សុខ សំអាត</Option>
            <Option value="2">លោកស្រី ចាន់ សុភា</Option>
          </Select>
        </Form.Item>
        <Form.Item name={['delegationSettings', 'autoDelegate']} valuePropName="checked">
          <Checkbox>ប្រគល់សិទ្ធិដោយស្វ័យប្រវត្តិពេលអវត្តមាន</Checkbox>
        </Form.Item>
        <Form.Item name={['delegationSettings', 'notifyOnDelegation']} valuePropName="checked">
          <Checkbox>ជូនដំណឹងពេលប្រគល់សិទ្ធិ</Checkbox>
        </Form.Item>
      </Card>

      <Card title="ចំណូលចិត្តលំហូរការងារ">
        <Form.Item name={['workflowPreferences', 'requireDoubleApproval']} valuePropName="checked">
          <Checkbox>ទាមទារការអនុម័តពីរដង</Checkbox>
        </Form.Item>
        <Form.Item name={['workflowPreferences', 'autoApproveLeave']} valuePropName="checked">
          <Checkbox>អនុម័តច្បាប់ឈប់សម្រាកដោយស្វ័យប្រវត្តិ (តិចជាង ៣ ថ្ងៃ)</Checkbox>
        </Form.Item>
      </Card>
    </>
  );

  const renderRegionalSpecificTab = () => (
    <>
      <Card title="យុត្តាធិការ" style={{ marginBottom: 16 }}>
        <Form.Item name={['jurisdiction', 'provinces']} label="ខេត្តក្រោមការគ្រប់គ្រង">
          <Select mode="multiple" placeholder="ជ្រើសរើសខេត្ត">
            <Option value="PP">ភ្នំពេញ</Option>
            <Option value="KD">កណ្តាល</Option>
            <Option value="KP">កំពង់ចាម</Option>
            <Option value="ST">ស្ទឹងត្រែង</Option>
          </Select>
        </Form.Item>
        <Form.Item name={['jurisdiction', 'totalSchools']} label="ចំនួនសាលាសរុប">
          <InputNumber min={0} style={{ width: '100%' }} disabled />
        </Form.Item>
      </Card>

      <Card title="ចំណូលចិត្តរបាយការណ៍" style={{ marginBottom: 16 }}>
        <Form.Item name={['reportPreferences', 'frequency']} label="ភាពញឹកញាប់របាយការណ៍">
          <Radio.Group>
            <Radio value="daily">ប្រចាំថ្ងៃ</Radio>
            <Radio value="weekly">ប្រចាំសប្តាហ៍</Radio>
            <Radio value="monthly">ប្រចាំខែ</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name={['reportPreferences', 'autoGenerate']} valuePropName="checked">
          <Checkbox>បង្កើតរបាយការណ៍ដោយស្វ័យប្រវត្តិ</Checkbox>
        </Form.Item>
        <Form.Item name={['reportPreferences', 'includeCharts']} valuePropName="checked">
          <Checkbox>រួមបញ្ចូលក្រាហ្វនិងតារាង</Checkbox>
        </Form.Item>
      </Card>

      <Card title="ផ្ទាំងគ្រប់គ្រង">
        <Form.Item name={['dashboardWidgets']} label="ធាតុផ្ទាំងគ្រប់គ្រង">
          <Checkbox.Group>
            <Row gutter={[16, 16]}>
              <Col span={12}><Checkbox value="statistics">ស្ថិតិទូទៅ</Checkbox></Col>
              <Col span={12}><Checkbox value="missions">បេសកកម្មថ្មីៗ</Checkbox></Col>
              <Col span={12}><Checkbox value="observations">ការសង្កេតថ្មីៗ</Checkbox></Col>
              <Col span={12}><Checkbox value="performance">ការអនុវត្ត</Checkbox></Col>
              <Col span={12}><Checkbox value="calendar">ប្រតិទិន</Checkbox></Col>
              <Col span={12}><Checkbox value="alerts">ការជូនដំណឹង</Checkbox></Col>
            </Row>
          </Checkbox.Group>
        </Form.Item>
      </Card>
    </>
  );

  const renderAdminSpecificTab = () => (
    <>
      <Card title="ការគ្រប់គ្រងប្រព័ន្ធ" style={{ marginBottom: 16 }}>
        <Form.Item name={['systemSettings', 'maintenanceWindow']} label="ពេលវេលាថែទាំប្រព័ន្ធ">
          <Select placeholder="ជ្រើសរើសពេលវេលា">
            <Option value="weekend">ចុងសប្តាហ៍</Option>
            <Option value="night">ពេលយប់ (10PM - 6AM)</Option>
            <Option value="custom">កំណត់ផ្ទាល់ខ្លួន</Option>
          </Select>
        </Form.Item>
        <Form.Item name={['systemSettings', 'backupFrequency']} label="ភាពញឹកញាប់បម្រុងទុក">
          <Radio.Group>
            <Radio value="hourly">រៀងរាល់ម៉ោង</Radio>
            <Radio value="daily">ប្រចាំថ្ងៃ</Radio>
            <Radio value="weekly">ប្រចាំសប្តាហ៍</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name={['systemSettings', 'retentionDays']} label="រយៈពេលរក្សាទុកទិន្នន័យ (ថ្ងៃ)">
          <InputNumber min={30} max={365} style={{ width: '100%' }} />
        </Form.Item>
      </Card>

      <Card title="ផ្លូវកាត់គ្រប់គ្រងអ្នកប្រើ" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button icon={<UserOutlined />} block>គ្រប់គ្រងអ្នកប្រើទាំងអស់</Button>
          <Button icon={<TeamOutlined />} block>គ្រប់គ្រងតួនាទី</Button>
          <Button icon={<SafetyOutlined />} block>គ្រប់គ្រងសិទ្ធិ</Button>
          <Button icon={<AuditOutlined />} block>កំណត់ហេតុសវនកម្ម</Button>
        </Space>
      </Card>

      <Card title="ការកំណត់សេចក្តីប្រកាស">
        <Form.Item name={['announcementSettings', 'allowBroadcast']} valuePropName="checked">
          <Checkbox>អនុញ្ញាតសេចក្តីប្រកាសទូទាំងប្រព័ន្ធ</Checkbox>
        </Form.Item>
        <Form.Item name={['announcementSettings', 'requireApproval']} valuePropName="checked">
          <Checkbox>ទាមទារការអនុម័តសម្រាប់សេចក្តីប្រកាស</Checkbox>
        </Form.Item>
      </Card>
    </>
  );

  const renderDataExportTab = () => (
    <>
      <Card title="ចំណូលចិត្តនាំចេញទិន្នន័យ" style={{ marginBottom: 16 }}>
        <Form.Item name={['exportPreferences', 'format']} label="ទម្រង់លំនាំដើម">
          <Radio.Group>
            <Radio value="excel">Excel (.xlsx)</Radio>
            <Radio value="csv">CSV</Radio>
            <Radio value="pdf">PDF</Radio>
            <Radio value="json">JSON</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name={['exportPreferences', 'includeHeaders']} valuePropName="checked">
          <Checkbox>រួមបញ្ចូលក្បាលតារាង</Checkbox>
        </Form.Item>
        <Form.Item name={['exportPreferences', 'includeMetadata']} valuePropName="checked">
          <Checkbox>រួមបញ្ចូលទិន្នន័យមេតា</Checkbox>
        </Form.Item>
      </Card>

      <Card title="កាលវិភាគនាំចេញស្វ័យប្រវត្តិ">
        <Form.Item name={['exportSchedule', 'enabled']} valuePropName="checked">
          <Switch checkedChildren="បើក" unCheckedChildren="បិទ" />
        </Form.Item>
        <Form.Item name={['exportSchedule', 'frequency']} label="ភាពញឹកញាប់">
          <Select placeholder="ជ្រើសរើស">
            <Option value="daily">ប្រចាំថ្ងៃ</Option>
            <Option value="weekly">ប្រចាំសប្តាហ៍</Option>
            <Option value="monthly">ប្រចាំខែ</Option>
          </Select>
        </Form.Item>
        <Form.Item name={['exportSchedule', 'recipients']} label="អ្នកទទួល">
          <Select mode="tags" placeholder="បញ្ចូលអ៊ីមែល">
            <Option value={user?.email}>{user?.email}</Option>
          </Select>
        </Form.Item>
      </Card>
    </>
  );

  // Determine which tabs to show based on user role
  const getTabs = () => {
    const commonTabs = [
      { key: '1', label: 'ព័ត៌មានមូលដ្ឋាន', icon: <UserOutlined />, content: renderBasicInfoTab() },
      { key: '2', label: 'សុវត្ថិភាព', icon: <LockOutlined />, content: renderSecurityTab() },
      { key: '3', label: 'ការជូនដំណឹង', icon: <BellOutlined />, content: renderNotificationTab() },
      { key: '4', label: 'ភាពអាចរកបាន', icon: <CalendarOutlined />, content: renderAvailabilityTab() },
    ];

    const roleSpecificTabs: Record<string, any[]> = {
      Teacher: [
        { key: '5', label: 'ព័ត៌មានគ្រូ', icon: <BookOutlined />, content: renderTeacherSpecificTab() },
      ],
      Director: [
        { key: '5', label: 'ព័ត៌មានគ្រូ', icon: <BookOutlined />, content: renderTeacherSpecificTab() },
        { key: '6', label: 'ការកំណត់នាយក', icon: <BankOutlined />, content: renderDirectorSpecificTab() },
      ],
      Cluster: [
        { key: '5', label: 'គ្រប់គ្រងចង្កោម', icon: <TeamOutlined />, content: renderRegionalSpecificTab() },
      ],
      Department: [
        { key: '5', label: 'គ្រប់គ្រងនាយកដ្ឋាន', icon: <BankOutlined />, content: renderRegionalSpecificTab() },
      ],
      Provincial: [
        { key: '5', label: 'គ្រប់គ្រងខេត្ត', icon: <BankOutlined />, content: renderRegionalSpecificTab() },
      ],
      Zone: [
        { key: '5', label: 'គ្រប់គ្រងតំបន់', icon: <SafetyOutlined />, content: renderRegionalSpecificTab() },
      ],
      Administrator: [
        { key: '5', label: 'ការកំណត់ប្រព័ន្ធ', icon: <SettingOutlined />, content: renderAdminSpecificTab() },
      ],
    };

    const allTabs = [
      ...commonTabs,
      ...(roleSpecificTabs[userRole] || []),
      { key: '10', label: 'នាំចេញទិន្នន័យ', icon: <ExportOutlined />, content: renderDataExportTab() },
    ];

    return allTabs;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>
          <SettingOutlined /> ការកំណត់
        </Title>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveBasicInfo}
          style={{ marginTop: 24 }}
        >
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {getTabs().map(tab => (
              <TabPane 
                tab={
                  <span>
                    {tab.icon}
                    {tab.label}
                  </span>
                } 
                key={tab.key}
              >
                {tab.content}
              </TabPane>
            ))}
          </Tabs>
          
          <Divider />
          
          {/* Action Buttons */}
          <Row justify="end" gutter={16}>
            <Col>
              <Button icon={<UndoOutlined />}>
                កំណត់ឡើងវិញ
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                រក្សាទុកការផ្លាស់ប្តូរ
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Change Password Modal */}
      <Modal
        title="ប្តូរពាក្យសម្ងាត់"
        open={changePasswordVisible}
        onCancel={() => setChangePasswordVisible(false)}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="currentPassword"
            label="ពាក្យសម្ងាត់បច្ចុប្បន្ន"
            rules={[{ required: true, message: 'សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន' }]}
          >
            <Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="ពាក្យសម្ងាត់ថ្មី"
            rules={[
              { required: true, message: 'សូមបញ្ចូលពាក្យសម្ងាត់ថ្មី' },
              { min: 8, message: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៨ តួអក្សរ' },
            ]}
          >
            <Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="បញ្ជាក់ពាក្យសម្ងាត់ថ្មី"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'សូមបញ្ជាក់ពាក្យសម្ងាត់ថ្មី' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('ពាក្យសម្ងាត់មិនដូចគ្នា'));
                },
              }),
            ]}
          >
            <Password />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setChangePasswordVisible(false)}>បោះបង់</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                ប្តូរពាក្យសម្ងាត់
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 2FA Setup Modal */}
      <Modal
        title="បើកការផ្ទៀងផ្ទាត់ពីរជំហាន"
        open={twoFactorModalVisible}
        onCancel={() => setTwoFactorModalVisible(false)}
        footer={null}
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="ស្កេន QR Code ជាមួយកម្មវិធីផ្ទៀងផ្ទាត់"
            description="ប្រើកម្មវិធីដូចជា Google Authenticator ឬ Microsoft Authenticator"
            type="info"
            showIcon
          />
          
          <div style={{ textAlign: 'center' }}>
            {qrCodeUrl && (
              <div style={{ padding: 20, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                <QrcodeOutlined style={{ fontSize: 150 }} />
              </div>
            )}
          </div>

          <Form onFinish={handleVerify2FA}>
            <Form.Item
              label="លេខកូដផ្ទៀងផ្ទាត់"
              rules={[{ required: true, message: 'សូមបញ្ចូលលេខកូដ' }]}
            >
              <Input
                placeholder="123456"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </Form.Item>
            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setTwoFactorModalVisible(false)}>បោះបង់</Button>
                <Button type="primary" htmlType="submit">
                  ផ្ទៀងផ្ទាត់
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Modal>

      {/* API Tokens Modal */}
      <Modal
        title="គ្រប់គ្រង API Tokens"
        open={apiTokensModalVisible}
        onCancel={() => setApiTokensModalVisible(false)}
        footer={null}
        width={800}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleGenerateApiToken}
          >
            បង្កើត Token ថ្មី
          </Button>

          <Table
            dataSource={apiTokens}
            columns={[
              {
                title: 'ឈ្មោះ',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Token',
                dataIndex: 'token',
                key: 'token',
                render: (token: string) => (
                  <Space>
                    <Text code copyable>{token}</Text>
                  </Space>
                ),
              },
              {
                title: 'បង្កើតនៅ',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (date: string) => new Date(date).toLocaleDateString('km-KH'),
              },
              {
                title: 'ប្រើចុងក្រោយ',
                dataIndex: 'lastUsed',
                key: 'lastUsed',
                render: (date: string) => date ? new Date(date).toLocaleDateString('km-KH') : 'មិនដែលប្រើ',
              },
              {
                title: 'សកម្មភាព',
                key: 'action',
                render: (_, record) => (
                  <Button 
                    type="link" 
                    danger
                    onClick={() => {
                      setApiTokens(apiTokens.filter(t => t.id !== record.id));
                      message.success('Token បានលុបដោយជោគជ័យ');
                    }}
                  >
                    លុប
                  </Button>
                ),
              },
            ]}
            pagination={false}
          />
        </Space>
      </Modal>

      {/* Signature Drawer */}
      <Drawer
        title="គូរហត្ថលេខា"
        placement="right"
        onClose={() => setSignatureDrawerVisible(false)}
        open={signatureDrawerVisible}
        width={400}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="គូរហត្ថលេខារបស់អ្នកខាងក្រោម"
            type="info"
            showIcon
          />
          
          <div style={{ 
            border: '2px dashed #d9d9d9', 
            borderRadius: 8, 
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fafafa'
          }}>
            <Text type="secondary">Canvas សម្រាប់គូរហត្ថលេខា</Text>
          </div>

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button icon={<ReloadOutlined />}>សម្អាត</Button>
            <Space>
              <Button onClick={() => setSignatureDrawerVisible(false)}>បោះបង់</Button>
              <Button 
                type="primary"
                onClick={() => {
                  setSignatureUrl('/mock-signature.png');
                  setSignatureDrawerVisible(false);
                  message.success('ហត្ថលេខាបានរក្សាទុក');
                }}
              >
                រក្សាទុក
              </Button>
            </Space>
          </Space>
        </Space>
      </Drawer>
    </div>
  );
};

export default SettingsPage;
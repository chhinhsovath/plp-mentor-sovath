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
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { EnhancedLocationPicker } from '../components/EnhancedLocationPicker';
import { userService } from '../services/user.service';

const { Title, Text } = Typography;
const { Option } = Select;

interface SettingsFormData {
  language: string;
  theme: 'light' | 'dark' | 'system';
  pushNotifications: boolean;
  emailNotifications: boolean;
  officeLocation?: string;
  officeLatitude?: number;
  officeLongitude?: number;
}

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [passwordForm] = Form.useForm();

  // Load saved settings
  useEffect(() => {
    const savedSettings = {
      language: localStorage.getItem('language') || 'km',
      theme: (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'light',
      pushNotifications: localStorage.getItem('pushNotifications') === 'true',
      emailNotifications: localStorage.getItem('emailNotifications') === 'true',
      officeLocation: user?.officeLocation || '',
      officeLatitude: user?.officeLatitude || null,
      officeLongitude: user?.officeLongitude || null,
    };
    form.setFieldsValue(savedSettings);
  }, [form, user]);

  const handleSaveSettings = async (values: SettingsFormData) => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('language', values.language);
      localStorage.setItem('theme', values.theme);
      localStorage.setItem('pushNotifications', String(values.pushNotifications));
      localStorage.setItem('emailNotifications', String(values.emailNotifications));

      // Save office location to backend if user is logged in
      if (user?.id && (values.officeLocation || values.officeLatitude || values.officeLongitude)) {
        await userService.updateUser(user.id, {
          officeLocation: values.officeLocation,
          officeLatitude: values.officeLatitude,
          officeLongitude: values.officeLongitude,
        });
      }

      // Apply theme change
      if (values.theme !== 'system') {
        setTheme(values.theme);
      } else {
        // For system theme, detect preference
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setTheme(systemTheme);
      }

      // Note: Language change is disabled as per app configuration
      // i18n.changeLanguage(values.language);

      message.success(t('pages.settings.saveSuccess'));
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error(t('pages.settings.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    Modal.confirm({
      title: t('pages.settings.resetConfirm'),
      content: t('pages.settings.resetConfirmMessage'),
      okText: t('common.yes'),
      cancelText: t('common.no'),
      onOk: () => {
        const defaultSettings: SettingsFormData = {
          language: 'km',
          theme: 'light',
          pushNotifications: true,
          emailNotifications: true,
        };
        form.setFieldsValue(defaultSettings);
        handleSaveSettings(defaultSettings);
      },
    });
  };

  const handleChangePassword = async (values: any) => {
    try {
      // TODO: Implement actual password change API call
      message.success(t('pages.settings.security.passwordChangeSuccess'));
      setChangePasswordVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error(t('pages.settings.security.passwordChangeError'));
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>{t('pages.settings.title')}</Title>
      <Text type="secondary">{t('pages.settings.description')}</Text>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSaveSettings}
        style={{ marginTop: 24 }}
      >
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            {/* Language Settings */}
            <Card
              title={
                <Space>
                  <GlobalOutlined />
                  {t('pages.settings.language.title')}
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Form.Item
                name="language"
                label={t('pages.settings.language.label')}
                extra={t('pages.settings.language.description')}
              >
                <Select size="large" disabled>
                  <Option value="km">
                    <Space>
                      <span role="img" aria-label="Khmer">🇰🇭</span>
                      {t('pages.settings.language.khmer')}
                    </Space>
                  </Option>
                  <Option value="en" disabled>
                    <Space>
                      <span role="img" aria-label="English">🇬🇧</span>
                      {t('pages.settings.language.english')}
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
              <Text type="secondary">
                <small>{t('pages.settings.language.note')}</small>
              </Text>
            </Card>

            {/* Theme Settings */}
            <Card
              title={
                <Space>
                  <BgColorsOutlined />
                  {t('pages.settings.theme.title')}
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Form.Item
                name="theme"
                label={t('pages.settings.theme.label')}
                extra={t('pages.settings.theme.description')}
              >
                <Select size="large">
                  <Option value="light">{t('pages.settings.theme.light')}</Option>
                  <Option value="dark">{t('pages.settings.theme.dark')}</Option>
                  <Option value="system">{t('pages.settings.theme.system')}</Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            {/* Notification Settings */}
            <Card
              title={
                <Space>
                  <BellOutlined />
                  {t('pages.settings.notifications.title')}
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Form.Item
                name="pushNotifications"
                label={t('pages.settings.notifications.push')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                name="emailNotifications"
                label={t('pages.settings.notifications.email')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Card>

            {/* Security Settings */}
            <Card
              title={
                <Space>
                  <LockOutlined />
                  {t('pages.settings.security.title')}
                </Space>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  icon={<KeyOutlined />}
                  onClick={() => setChangePasswordVisible(true)}
                  block
                >
                  {t('pages.settings.security.changePassword')}
                </Button>
                <Button
                  icon={<SafetyOutlined />}
                  disabled
                  block
                >
                  {t('pages.settings.security.twoFactor')}
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    ({t('common.comingSoon')})
                  </Text>
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Office Location Settings */}
        <Card
          title={
            <Space>
              <EnvironmentOutlined />
              ទីតាំងការិយាល័យ/សាលារៀន
            </Space>
          }
          style={{ marginTop: 24, marginBottom: 24 }}
        >
          <Form.Item
            name="officeLocation"
            label="ឈ្មោះទីតាំងការិយាល័យ/សាលារៀន"
          >
            <Input 
              placeholder="បញ្ចូលឈ្មោះការិយាល័យ ឬសាលារៀន" 
              prefix={<EnvironmentOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="ទីតាំងនៅលើផែនទី"
            extra="ចុចលើផែនទីដើម្បីកំណត់ទីតាំងការិយាល័យ/សាលារៀនរបស់អ្នក"
          >
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Form.Item
                  name="officeLatitude"
                  label="Latitude"
                  hidden
                >
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="officeLongitude"
                  label="Longitude"
                  hidden
                >
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Button
              icon={<EnvironmentOutlined />}
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      form.setFieldsValue({
                        officeLatitude: position.coords.latitude,
                        officeLongitude: position.coords.longitude,
                      });
                      message.success('ទីតាំងបច្ចុប្បន្នបានកំណត់ដោយជោគជ័យ');
                    },
                    (error) => {
                      console.error('Error getting location:', error);
                      message.error('មិនអាចទទួលបានទីតាំងបច្ចុប្បន្ន។ សូមពិនិត្យការអនុញ្ញាតទីតាំង។');
                    }
                  );
                } else {
                  message.error('កម្មវិធីរុករករបស់អ្នកមិនគាំទ្រទីតាំង GPS ទេ');
                }
              }}
              style={{ marginBottom: 16 }}
              block
            >
              ប្រើទីតាំងបច្ចុប្បន្នរបស់ខ្ញុំ
            </Button>

            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => 
              prevValues.officeLatitude !== currentValues.officeLatitude || 
              prevValues.officeLongitude !== currentValues.officeLongitude
            }>
              {() => (
                <EnhancedLocationPicker
                  latitude={form.getFieldValue('officeLatitude')}
                  longitude={form.getFieldValue('officeLongitude')}
                  onLocationChange={(lat, lng, address) => {
                    form.setFieldsValue({
                      officeLatitude: lat,
                      officeLongitude: lng,
                      officeLocation: address || form.getFieldValue('officeLocation'),
                    });
                  }}
                  height={300}
                  placeholder="ស្វែងរកទីតាំងការិយាល័យ/សាលារៀន..."
                  showCoordinates={true}
                  showSearchHistory={true}
                />
              )}
            </Form.Item>
          </Form.Item>
        </Card>

        <Divider />

        {/* Action Buttons */}
        <Space size="middle">
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={loading}
            size="large"
          >
            {t('pages.settings.save')}
          </Button>
          <Button
            icon={<UndoOutlined />}
            onClick={handleResetSettings}
            size="large"
          >
            {t('pages.settings.resetDefault')}
          </Button>
        </Space>
      </Form>

      {/* Change Password Modal */}
      <Modal
        title={t('pages.settings.security.changePassword')}
        open={changePasswordVisible}
        onCancel={() => {
          setChangePasswordVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="currentPassword"
            label={t('pages.settings.security.currentPassword')}
            rules={[
              { required: true, message: t('validation.required') },
            ]}
          >
            <Input.Password size="large" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label={t('pages.settings.security.newPassword')}
            rules={[
              { required: true, message: t('validation.required') },
              { min: 6, message: t('validation.passwordLength') },
            ]}
          >
            <Input.Password size="large" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t('pages.settings.security.confirmPassword')}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: t('validation.required') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('validation.passwordMismatch')));
                },
              }),
            ]}
          >
            <Input.Password size="large" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {t('common.save')}
              </Button>
              <Button onClick={() => {
                setChangePasswordVisible(false);
                passwordForm.resetFields();
              }}>
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
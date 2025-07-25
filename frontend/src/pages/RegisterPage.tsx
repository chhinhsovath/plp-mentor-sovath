import { useState, useEffect } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Alert, 
  Row, 
  Col,
  Select,
  Space,
  Divider
} from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, UserAddOutlined, PhoneOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { RegisterData } from '../types/auth'
import { ErrorService } from '../services/error.service'

const { Title, Text, Link } = Typography
const { Option } = Select

const RegisterPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register, isAuthenticated, isLoading: authLoading } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/')
    }
  }, [isAuthenticated, authLoading, navigate])

  const onFinish = async (values: RegisterData) => {
    setError('')
    setLoading(true)
    
    try {
      await register(values)
      navigate('/login', { 
        state: { 
          message: t('auth.registrationSuccess') 
        } 
      })
    } catch (err: any) {
      console.error('Registration error:', err)
      
      // Use ErrorService for comprehensive error handling
      const errorInfo = ErrorService.parseError(err, t)
      setError(errorInfo.message)
      
      // Log error for monitoring
      ErrorService.logError(errorInfo, { context: 'register', userData: { username: values.username, email: values.email } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <Row justify="center" style={{ width: '100%' }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={10}>
          <Card
            style={{
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              border: 'none',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#1890ff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <UserAddOutlined style={{ fontSize: '32px', color: 'white' }} />
              </div>
              
              <Title level={2} style={{ marginBottom: '8px', color: '#262626' }}>
                {t('auth.createAccount')}
              </Title>
              
              <Text type="secondary" style={{ fontSize: '16px' }}>
                {t('auth.joinPlatform')}
              </Text>
            </div>

            <Divider style={{ marginBottom: '32px' }} />

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                style={{ marginBottom: '24px' }}
                closable
                onClose={() => setError('')}
              />
            )}

            <Form
              form={form}
              name="register"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              requiredMark={false}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="firstName"
                    label={t('auth.firstName')}
                    rules={[
                      { required: true, message: t('auth.validation.firstNameRequired') },
                      { min: 2, message: t('auth.validation.firstNameMinLength') }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder={t('auth.firstName')}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="lastName"
                    label={t('auth.lastName')}
                    rules={[
                      { required: true, message: t('auth.validation.lastNameRequired') },
                      { min: 2, message: t('auth.validation.lastNameMinLength') }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder={t('auth.lastName')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="username"
                label={t('auth.username')}
                rules={[
                  { required: true, message: t('auth.validation.usernameRequired') },
                  { min: 3, message: t('auth.validation.usernameMinLength') },
                  { max: 50, message: t('auth.validation.usernameMaxLength') },
                  {
                    pattern: /^[a-zA-Z0-9_.-]+$/,
                    message: t('auth.validation.usernamePattern')
                  }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder={t('auth.username')}
                />
              </Form.Item>

              <Form.Item
                name="email"
                label={t('auth.email')}
                rules={[
                  { required: true, message: t('auth.validation.emailRequired') },
                  { type: 'email', message: t('auth.validation.emailInvalid') }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder={t('auth.email')}
                  type="email"
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label={t('auth.phone')}
                rules={[
                  { required: false },
                  { 
                    pattern: /^\+?[\d\s\-\(\)]+$/, 
                    message: t('auth.validation.phoneInvalid') 
                  }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder={t('auth.phone')}
                />
              </Form.Item>

              <Form.Item
                name="role"
                label={t('auth.role')}
                rules={[
                  { required: true, message: 'Please select a role' }
                ]}
              >
                <Select placeholder={t('auth.selectRole')}>
                  <Option value="teacher">{t('roles.teacher')}</Option>
                  <Option value="observer">{t('roles.observer')}</Option>
                  <Option value="director">{t('roles.director')}</Option>
                  <Option value="cluster">{t('roles.cluster')}</Option>
                  <Option value="department">{t('roles.department')}</Option>
                  <Option value="provincial">{t('roles.provincial')}</Option>
                  <Option value="zone">{t('roles.zone')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="password"
                label={t('auth.password')}
                rules={[
                  { required: true, message: 'Password is required' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder={t('auth.password')}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={t('auth.confirmPassword')}
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder={t('auth.confirmPassword')}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: '16px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading || authLoading}
                  icon={<UserAddOutlined />}
                  style={{
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: '500',
                  }}
                >
                  {loading || authLoading ? t('common.loading') : t('auth.createAccount')}
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Text type="secondary">
                  {t('auth.alreadyHaveAccount')} {' '}
                  <Link href="/login">
                    {t('auth.signIn')}
                  </Link>
                </Text>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default RegisterPage
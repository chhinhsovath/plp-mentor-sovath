import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Alert, 
  Row, 
  Col,
  Space,
  Divider
} from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { LoginCredentials } from '../types/auth'
import { ErrorService } from '../services/error.service'
import QuickRoleLogin from '../components/Auth/QuickRoleLogin'

const { Title, Text, Link } = Typography

const LoginPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate, location])

  // Fill demo credentials function
  const fillDemoCredentials = (username: string, password: string) => {
    form.setFieldsValue({
      username,
      password
    })
    // Auto-submit the form after filling credentials
    setTimeout(() => {
      form.submit()
    }, 100)
  }

  const onFinish = async (values: LoginCredentials) => {
    setError('')
    setLoading(true)
    
    try {
      await login(values)
      // Navigation will be handled by the useEffect above
    } catch (err: any) {
      console.error('Login error:', err)
      
      // Use ErrorService for comprehensive error handling
      const errorInfo = ErrorService.parseError(err, t)
      setError(errorInfo.message)
      
      // Log error for monitoring
      ErrorService.logError(errorInfo, { context: 'login', username: values.username })
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
        overflowY: 'auto',
      }}
    >
      <Row justify="center" style={{ width: '100%', maxWidth: '1200px', margin: '20px 0' }}>
        <Col xs={24} sm={22} md={20} lg={16} xl={14} xxl={12}>
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
                <LoginOutlined style={{ fontSize: '32px', color: 'white' }} />
              </div>
              
              <Title level={2} style={{ marginBottom: '8px', color: '#262626' }}>
                {t('app.title')}
              </Title>
              
              <Text type="secondary" style={{ fontSize: '16px' }}>
                {t('app.subtitle')}
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
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              requiredMark={false}
              initialValues={{
                username: '',
                password: ''
              }}
            >
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
                  autoComplete="username"
                  autoFocus
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={t('auth.password')}
                rules={[
                  { required: true, message: t('auth.validation.passwordRequired') },
                  { min: 6, message: t('auth.validation.passwordMinLength') }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder={t('auth.password')}
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: '16px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading || authLoading}
                  icon={<LoginOutlined />}
                  style={{
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: '500',
                  }}
                >
                  {loading || authLoading ? t('common.loading') : t('auth.loginButton')}
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Link href="#" style={{ fontSize: '14px' }}>
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </Form>

            <Divider style={{ margin: '32px 0 24px' }}>
              <Text type="secondary">ឬ</Text>
            </Divider>

            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  ព័ត៌មានចូលប្រើសាកល្បង
                </Text>
                
                <Space direction="vertical" size="small">
                  <Space>
                    <Text strong>{t('auth.demo.adminLabel')}</Text>
                    <Text code>chhinhs/password</Text>
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => fillDemoCredentials('chhinhs', 'password')}
                    >
                      Fill
                    </Button>
                  </Space>
                  
                  <Space>
                    <Text strong>{t('auth.demo.teacherLabel')}</Text>
                    <Text code>teacher/teacher123</Text>
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => fillDemoCredentials('teacher', 'teacher123')}
                    >
                      Fill
                    </Button>
                  </Space>
                </Space>
              </Space>
            </div>
          </Card>
          
          {/* Quick Role Login Component */}
          <QuickRoleLogin onSelectRole={fillDemoCredentials} />
        </Col>
      </Row>
    </div>
  )
}

export default LoginPage
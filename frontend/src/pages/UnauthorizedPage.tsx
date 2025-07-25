import React from 'react'
import { Result, Button } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <Result
      status="403"
      title={t('unauthorized.title')}
      subTitle={t('unauthorized.message')}
      icon={<LockOutlined style={{ fontSize: 80, color: '#ff4d4f' }} />}
      extra={[
        <Button type="primary" key="home" onClick={() => navigate('/')}>
          {t('unauthorized.goHome')}
        </Button>,
        <Button key="back" onClick={() => navigate(-1)}>
          {t('unauthorized.goBack')}
        </Button>,
      ]}
    />
  )
}

export default UnauthorizedPage
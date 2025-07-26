import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Layout,
  Menu,
  Avatar,
  Typography,
  Space,
  Dropdown,
  Button,
  Drawer,
  Grid,
  theme,
} from 'antd'
import {
  DashboardOutlined,
  EyeOutlined,
  BarChartOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FormOutlined,
  DeploymentUnitOutlined,
  PieChartOutlined,
  FileTextOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  ShieldOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  LinkOutlined,
  DashboardFilled,
  HeartOutlined,
  DollarOutlined,
  CalculatorOutlined,
  SwapOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  FundProjectionScreenOutlined,
  GlobalOutlined,
  ControlOutlined,
  AreaChartOutlined,
  LineChartOutlined,
  SolutionOutlined,
  BankOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { PERMISSIONS } from '../../utils/permissions'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography
const { useBreakpoint } = Grid

interface MenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  path?: string
  children?: MenuItem[]
  requiredRoles?: string[]
  requiredPermissions?: string[]
  minimumRole?: string
  type?: 'divider'
}

const AntdLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>([])
  
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const permissions = usePermissions()
  const screens = useBreakpoint()
  const { token } = theme.useToken()

  const isMobile = !screens.md

  // Initialize collapsed state from localStorage (only for desktop)
  useEffect(() => {
    if (!isMobile) {
      const savedState = localStorage.getItem('sidebarCollapsed')
      setCollapsed(savedState === 'true')
      
      // Load saved open keys
      const savedOpenKeys = localStorage.getItem('sidebarOpenKeys')
      if (savedOpenKeys) {
        setOpenKeys(JSON.parse(savedOpenKeys))
      }
    }
  }, [isMobile])

  // Save collapsed state to localStorage
  const handleToggleCollapse = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    if (!isMobile) {
      localStorage.setItem('sidebarCollapsed', newCollapsed.toString())
    }
  }

  // Helper function to get role name safely
  const getRoleName = () => {
    if (!user) return ''
    
    if (typeof user.role === 'string') {
      return user.role.toLowerCase()
    }
    
    if (user.role && typeof user.role === 'object' && user.role.name) {
      return user.role.name.toLowerCase()
    }
    
    if (user.username === 'chhinhhs') {
      return 'administrator'
    }
    
    return 'user'
  }

  // Organized menu structure with categories
  const menuItems: MenuItem[] = [
    {
      key: 'dashboard',
      label: t('navigation.dashboard') || 'ផ្ទាំងគ្រប់គ្រង',
      icon: <DashboardOutlined />,
      path: '/',
    },
    
    // Core Operations Category
    {
      key: 'core-operations',
      label: 'ប្រតិបត្តិការសំខាន់',
      icon: <SolutionOutlined />,
      children: [
        {
          key: 'observations',
          label: t('navigation.observations') || 'ការសង្កេត',
          icon: <EyeOutlined />,
          path: '/observations',
          requiredPermissions: [PERMISSIONS.VIEW_OBSERVATION],
        },
        {
          key: 'observations-khmer',
          label: 'ទំរង់វាយតម្លៃការបង្រៀន',
          icon: <FormOutlined />,
          path: '/observations/khmer-form',
          requiredPermissions: [PERMISSIONS.VIEW_OBSERVATION],
        },
        {
          key: 'missions',
          label: t('navigation.missions') || 'បេសកកម្ម',
          icon: <DeploymentUnitOutlined />,
          path: '/missions',
          requiredPermissions: [PERMISSIONS.APPROVE_MISSIONS],
          minimumRole: 'administrator',
        },
        {
          key: 'forms',
          label: t('navigation.forms') || 'ទម្រង់',
          icon: <FormOutlined />,
          path: '/forms',
          requiredPermissions: [PERMISSIONS.MANAGE_FORMS],
          minimumRole: 'department',
        },
        {
          key: 'surveys',
          label: t('navigation.surveys') || 'ការស្ទង់មតិ',
          icon: <FileTextOutlined />,
          path: '/admin/surveys',
          requiredPermissions: [PERMISSIONS.MANAGE_FORMS],
          minimumRole: 'administrator',
        },
      ],
    },
    
    // Analytics & Reports Category
    {
      key: 'analytics-reports',
      label: 'ការវិភាគ និងរបាយការណ៍',
      icon: <AreaChartOutlined />,
      children: [
        {
          key: 'analytics',
          label: t('navigation.analytics') || 'ផ្ទាំងវិភាគ',
          icon: <PieChartOutlined />,
          path: '/analytics',
          requiredPermissions: [PERMISSIONS.VIEW_ANALYTICS],
          minimumRole: 'cluster',
        },
        {
          key: 'reports',
          label: t('navigation.reports') || 'របាយការណ៍',
          icon: <BarChartOutlined />,
          path: '/reports',
          requiredPermissions: [PERMISSIONS.VIEW_REPORTS],
          minimumRole: 'director',
        },
        {
          key: 'performance',
          label: t('navigation.performance') || 'ដំណើរការ',
          icon: <ThunderboltOutlined />,
          path: '/performance',
          minimumRole: 'administrator',
        },
        {
          key: 'comparative-analytics',
          label: 'វិភាគប្រៀបធៀប',
          icon: <SwapOutlined />,
          path: '/comparative-analytics',
          minimumRole: 'department',
        },
      ],
    },
    
    // Impact & Showcase Category
    {
      key: 'impact-showcase',
      label: 'ផលប៉ះពាល់ និងបង្ហាញ',
      icon: <FundProjectionScreenOutlined />,
      children: [
        {
          key: 'results-chain',
          label: 'ខ្សែសង្វាក់លទ្ធផល',
          icon: <LinkOutlined />,
          path: '/results-chain',
          minimumRole: 'department',
        },
        {
          key: 'impact',
          label: 'ផ្ទាំងផលប៉ះពាល់',
          icon: <DashboardFilled />,
          path: '/impact',
        },
        {
          key: 'success-stories',
          label: 'រឿងរ៉ាវជោគជ័យ',
          icon: <HeartOutlined />,
          path: '/success-stories',
        },
        {
          key: 'presentation',
          label: 'បទបង្ហាញ',
          icon: <PlayCircleOutlined />,
          path: '/presentation',
          minimumRole: 'department',
        },
      ],
    },
    
    // Stakeholder Engagement Category
    {
      key: 'stakeholder-engagement',
      label: 'ការចូលរួមភាគីពាក់ព័ន្ធ',
      icon: <GlobalOutlined />,
      children: [
        {
          key: 'donor-portal',
          label: 'វិស័យអ្នកឧបត្ថម្ភ',
          icon: <DollarOutlined />,
          path: '/donor-portal',
          minimumRole: 'department',
        },
        {
          key: 'roi-calculator',
          label: 'គណនា ROI',
          icon: <CalculatorOutlined />,
          path: '/roi-calculator',
        },
      ],
    },
    
    // Administration Category
    {
      key: 'administration',
      label: 'រដ្ឋបាល',
      icon: <ControlOutlined />,
      children: [
        {
          key: 'users',
          label: t('navigation.users') || 'អ្នកប្រើប្រាស់',
          icon: <UsergroupAddOutlined />,
          path: '/users',
          requiredPermissions: [PERMISSIONS.VIEW_USERS],
          minimumRole: 'department',
        },
        {
          key: 'schools',
          label: t('navigation.schools') || 'សាលារៀន',
          icon: <BankOutlined />,
          path: '/schools',
          minimumRole: 'administrator',
        },
      ],
    },
    
    // System Management Category (Admin Only)
    {
      key: 'system-management',
      label: 'ការគ្រប់គ្រងប្រព័ន្ធ',
      icon: <SettingOutlined />,
      minimumRole: 'administrator',
      children: [
        {
          key: 'security',
          label: t('navigation.security') || 'សុវត្ថិភាព',
          icon: <SafetyCertificateOutlined />,
          path: '/security',
          minimumRole: 'administrator',
        },
        {
          key: 'backup',
          label: t('navigation.backup') || 'បម្រុងទុក',
          icon: <DatabaseOutlined />,
          path: '/backup',
          minimumRole: 'administrator',
        },
      ],
    },
    
    // Divider
    {
      key: 'divider-1',
      type: 'divider',
    },
    
    // Settings (always visible)
    {
      key: 'settings',
      label: t('navigation.settings') || 'ការកំណត់',
      icon: <SettingOutlined />,
      path: '/settings',
    },
  ]

  const hasAccess = (item: MenuItem): boolean => {
    if (!user) return false

    // Check minimum role requirement
    if (item.minimumRole && !permissions.hasMinimumRole(item.minimumRole)) {
      return false
    }

    // Check permission-based access
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      if (!permissions.hasAllPermissions(item.requiredPermissions)) {
        return false
      }
    }

    // Check role-based access (legacy support)
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      const userRole = user.role.name?.toLowerCase()
      const hasRole = item.requiredRoles.some(role => role.toLowerCase() === userRole)
      if (!hasRole) {
        return false
      }
    }

    return true
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      navigate('/login')
    }
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    // Find the item recursively
    const findItem = (items: MenuItem[]): MenuItem | undefined => {
      for (const item of items) {
        if (item.key === key) return item
        if (item.children) {
          const found = findItem(item.children)
          if (found) return found
        }
      }
      return undefined
    }
    
    const item = findItem(menuItems)
    if (item && item.path) {
      navigate(item.path)
      if (isMobile) {
        setMobileDrawerOpen(false)
      }
    }
  }

  // Handle submenu open/close
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys)
    if (!isMobile) {
      localStorage.setItem('sidebarOpenKeys', JSON.stringify(keys))
    }
  }

  // Create menu items for Ant Design Menu component
  const createAntdMenuItems = (items: MenuItem[]): MenuProps['items'] => {
    return items
      .filter(hasAccess)
      .map(item => {
        if (item.type === 'divider') {
          return { type: 'divider', key: item.key }
        }
        
        if (item.children) {
          // Filter children and only show parent if there are accessible children
          const accessibleChildren = item.children.filter(hasAccess)
          if (accessibleChildren.length === 0) return null
          
          return {
            key: item.key,
            icon: item.icon,
            label: item.label,
            children: createAntdMenuItems(accessibleChildren),
          }
        }
        
        return {
          key: item.key,
          icon: item.icon,
          label: item.label,
        }
      })
      .filter(Boolean) as MenuProps['items']
  }

  const antdMenuItems = createAntdMenuItems(menuItems)

  // User dropdown menu items
  const userMenuItems = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: t('navigation.settings'),
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout'),
      onClick: handleLogout,
      danger: true,
    },
  ]

  // Get current selected key by checking the path
  const getSelectedKey = () => {
    // Special handling for home page
    if (location.pathname === '/') {
      return 'dashboard'
    }
    
    const findKey = (items: MenuItem[]): string | null => {
      for (const item of items) {
        // Skip if user doesn't have access
        if (!hasAccess(item)) continue
        
        if (item.path && item.path === location.pathname) {
          return item.key
        }
        
        if (item.children) {
          const childKey = findKey(item.children)
          if (childKey) return childKey
        }
      }
      return null
    }
    
    const key = findKey(menuItems)
    return key || 'dashboard'
  }

  const selectedKey = getSelectedKey()

  // Get parent keys for opening submenus
  const getDefaultOpenKeys = () => {
    const findParentKey = (items: MenuItem[], targetPath: string, parentKey?: string): string | null => {
      for (const item of items) {
        if (item.path === targetPath && parentKey) {
          return parentKey
        }
        if (item.children) {
          const result = findParentKey(item.children, targetPath, item.key)
          if (result) return result
        }
      }
      return null
    }
    
    const parentKey = findParentKey(menuItems, location.pathname)
    return parentKey ? [parentKey] : []
  }

  // Update open keys when location changes
  useEffect(() => {
    if (!collapsed && !isMobile) {
      const defaultKeys = getDefaultOpenKeys()
      if (defaultKeys.length > 0) {
        setOpenKeys(prev => {
          const newKeys = [...new Set([...prev, ...defaultKeys])]
          localStorage.setItem('sidebarOpenKeys', JSON.stringify(newKeys))
          return newKeys
        })
      }
    }
  }, [location.pathname, collapsed, isMobile])

  // Get current page title
  const getPageTitle = () => {
    // Special handling for home page
    if (location.pathname === '/') {
      return t('navigation.dashboard') || 'ផ្ទាំងគ្រប់គ្រង'
    }
    
    const findTitle = (items: MenuItem[]): string | null => {
      for (const item of items) {
        // Skip if user doesn't have access
        if (!hasAccess(item)) continue
        
        if (item.path && item.path === location.pathname) {
          return item.label
        }
        
        if (item.children) {
          const childTitle = findTitle(item.children)
          if (childTitle) return childTitle
        }
      }
      return null
    }
    
    const title = findTitle(menuItems)
    return title || t('navigation.dashboard') || 'ផ្ទាំងគ្រប់គ្រង'
  }

  const siderContent = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <div style={{
        padding: collapsed ? '16px 8px' : '16px 24px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        {!collapsed && (
          <Title level={4} style={{ margin: 0, color: token.colorTextLightSolid }}>
            PLP Mentor
          </Title>
        )}
        {collapsed && (
          <Title level={4} style={{ margin: 0, color: token.colorTextLightSolid }}>
            PM
          </Title>
        )}
      </div>

      {/* User Profile */}
      <div style={{
        padding: collapsed ? '16px 8px' : '16px 24px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 12,
      }}>
        <Avatar
          size={collapsed ? 32 : 40}
          style={{ backgroundColor: token.colorPrimary }}
        >
          {user?.fullName?.charAt(0).toUpperCase()}
        </Avatar>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              color: token.colorTextLightSolid, 
              fontWeight: 500,
              fontSize: '14px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user?.fullName}
            </div>
            <div style={{ 
              color: token.colorTextLightSolid + '80', 
              fontSize: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {t(`roles.${getRoleName()}`)}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={handleOpenChange}
          items={antdMenuItems}
          onClick={handleMenuClick}
          inlineCollapsed={collapsed}
          style={{ 
            borderRight: 0,
            background: 'transparent',
          }}
        />
      </div>

      {/* Logout Button */}
      <div style={{
        padding: collapsed ? '16px 8px' : '16px 24px',
        borderTop: `1px solid ${token.colorBorderSecondary}`,
      }}>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{
            width: '100%',
            textAlign: 'left',
            color: token.colorTextLightSolid,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          {!collapsed && t('auth.logout')}
        </Button>
      </div>
    </div>
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={280}
          collapsedWidth={64}
          theme="dark"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1000,
          }}
        >
          {siderContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      <Drawer
        title="PLP Mentor"
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        styles={{
          body: { padding: 0 },
          header: { backgroundColor: token.colorBgContainer },
        }}
        width="280px"
      >
        <div style={{ backgroundColor: token.colorBgElevated, height: '100%' }}>
          {/* User Profile in Mobile Drawer */}
          <div style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            backgroundColor: token.colorBgContainer,
          }}>
            <Avatar size={40} style={{ backgroundColor: token.colorPrimary }}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>
                {user?.fullName}
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {t(`roles.${getRoleName()}`)}
              </Text>
            </div>
          </div>

          {/* Mobile Menu */}
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            items={antdMenuItems}
            onClick={handleMenuClick}
            style={{ borderRight: 0 }}
          />

          {/* Mobile Logout */}
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              danger
              style={{ width: '100%', textAlign: 'left', height: 40 }}
            >
              {t('auth.logout')}
            </Button>
          </div>
        </div>
      </Drawer>

      <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 64 : 280) }}>
        {/* Header */}
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 999,
          }}
        >
          <Space>
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuFoldOutlined />}
                onClick={() => setMobileDrawerOpen(true)}
                size="large"
              />
            ) : (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={handleToggleCollapse}
                size="large"
              />
            )}
            
            <Title level={4} style={{ margin: 0 }}>
              {getPageTitle()}
            </Title>
          </Space>

          {!isMobile && (
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button type="text" style={{ height: 40 }}>
                <Space>
                  <Avatar size={32} style={{ backgroundColor: token.colorPrimary }}>
                    {user?.fullName?.charAt(0).toUpperCase()}
                  </Avatar>
                  <span>{user?.fullName}</span>
                </Space>
              </Button>
            </Dropdown>
          )}
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            minHeight: 'calc(100vh - 112px)',
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AntdLayout
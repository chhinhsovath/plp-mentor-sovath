import { theme } from 'antd'
import { ThemeConfig } from 'antd'

const { defaultAlgorithm, darkAlgorithm } = theme

export const antdTheme: ThemeConfig = {
  algorithm: defaultAlgorithm,
  token: {
    // Primary colors for the mentoring platform
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    
    // Border and background
    borderRadius: 6,
    wireframe: false,
    
    // Typography - Hanuman for Khmer text
    fontFamily: '"Hanuman", "Noto Sans Khmer", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    
    // Layout
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    
    // Professional spacing
    marginXS: 8,
    marginSM: 12,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,
  },
  components: {
    // Layout components
    Layout: {
      headerBg: '#001529',
      headerHeight: 64,
      headerPadding: '0 24px',
      siderBg: '#001529',
      triggerBg: '#002140',
      triggerColor: '#fff',
    },
    
    // Menu styling
    Menu: {
      darkItemBg: '#001529',
      darkItemSelectedBg: '#1890ff',
      darkItemHoverBg: '#112545',
      itemSelectedBg: '#e6f7ff',
      itemHoverBg: '#f5f5f5',
    },
    
    // Button styling
    Button: {
      borderRadius: 6,
      controlHeight: 40,
      fontSize: 14,
      fontWeight: 500,
    },
    
    // Table styling for data grids
    Table: {
      headerBg: '#fafafa',
      headerColor: '#262626',
      headerSortActiveBg: '#f0f0f0',
      headerSortHoverBg: '#f5f5f5',
      bodySortBg: '#fafafa',
      rowHoverBg: '#f5f5f5',
      borderColor: '#f0f0f0',
    },
    
    // Form components
    Form: {
      labelColor: '#262626',
      labelFontSize: 14,
      itemMarginBottom: 24,
    },
    
    // Input components
    Input: {
      borderRadius: 6,
      controlHeight: 40,
      fontSize: 14,
      paddingInline: 12,
    },
    
    // Select components
    Select: {
      borderRadius: 6,
      controlHeight: 40,
      fontSize: 14,
    },
    
    // Card components
    Card: {
      borderRadius: 8,
      paddingLG: 24,
      headerBg: '#fafafa',
      headerFontSize: 16,
      headerFontSizeSM: 14,
    },
    
    // Modal components
    Modal: {
      borderRadius: 8,
      headerBg: '#fafafa',
      titleFontSize: 16,
      titleLineHeight: 1.5,
    },
    
    // Notification components
    Notification: {
      borderRadius: 8,
      paddingMD: 16,
    },
    
    // Drawer components
    Drawer: {
      colorBgElevated: '#fafafa',
      colorBgContainer: '#ffffff',
    },
    
    // Typography components - Moul font for headings
    Typography: {
      titleMarginTop: 0,
      titleMarginBottom: 0.5,
      fontSizeHeading1: 38,
      fontSizeHeading2: 30,
      fontSizeHeading3: 24,
      fontWeightStrong: 700,
    },
  },
}

// Dark theme variant for future use
export const antdDarkTheme: ThemeConfig = {
  ...antdTheme,
  algorithm: darkAlgorithm,
  token: {
    ...antdTheme.token,
    colorBgContainer: '#141414',
    colorBgElevated: '#1f1f1f',
    colorBgLayout: '#000000',
  },
}

// Export themes with standard names for ThemeContext
export const lightTheme = antdTheme
export const darkTheme = antdDarkTheme
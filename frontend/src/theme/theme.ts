// Ant Design theme configuration for the mentoring platform
export const theme = {
  // Basic color palette matching the original design intent
  colors: {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#04AA6D',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
  },
  // Typography configuration
  typography: {
    fontFamily: [
      'Hanuman',
      'Noto Sans Khmer',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  // Breakpoints for responsive design
  breakpoints: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
};

// Export default for compatibility
export default theme;
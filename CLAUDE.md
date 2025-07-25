# Project Context and Instructions

## Important Project Information

### Language Context
- This is a **monolingual site** with **Khmer context only**
- All UI text, labels, and content should be in Khmer language
- No multi-language support is needed

### UI Framework
- **Primary UI Library**: Ant Design React JS (antd)
- **DO NOT** use Material UI or other UI libraries
- Always leverage Ant Design components for all UI needs
- Use Ant Design's built-in styling system and theme customization

### Technical Stack
- React with TypeScript
- Ant Design (antd) for UI components
- Vite as build tool
- React Router for navigation

### Design Guidelines
1. Always use Ant Design components:
   - Form, Input, Button, Select, DatePicker, Table, Modal, etc.
   - Layout components: Layout, Header, Content, Footer, Sider
   - Navigation: Menu, Breadcrumb, Steps
   - Feedback: Alert, Message, Notification, Progress

2. For styling:
   - Use Ant Design's theme customization
   - Leverage Ant Design's built-in CSS classes
   - Use CSS modules or styled-components only when necessary

3. For icons:
   - Use @ant-design/icons package
   - Do not import icons from other libraries

### Key Project Features
- PLP Mentor Management System
- Observation forms and tracking
- Mission management
- User management with role-based access
- Offline-first capability

### Development Practices
- Follow Ant Design's design patterns and best practices
- Use Ant Design's form validation methods
- Implement responsive design using Ant Design's Grid system
- Use Ant Design's internationalization features for Khmer text

## Default Instructions for Code Agent

When implementing features in this project:

1. **Always use Ant Design components** - Do not suggest or use Material UI, Bootstrap, or other UI libraries
2. **All text should be in Khmer** - This is a monolingual Khmer application
3. **Follow existing patterns** - Check existing components for consistent implementation
4. **Leverage Ant Design features** - Use built-in validation, theming, and responsive utilities
5. **Maintain consistency** - Use the same Ant Design components and patterns throughout the application
# Observation Forms API List

Base URL: `http://157.10.73.52:3001/api/v1`

## 1. Observation Forms APIs (`/observation-forms`)

### Basic CRUD Operations
- **POST** `/observation-forms` - Create a new observation form template (Admin/Zone/Provincial only)
- **GET** `/observation-forms` - Get all observation forms with optional filtering
  - Query params: `subject`, `grade`, `search`
- **GET** `/observation-forms/:id` - Get observation form by ID
- **GET** `/observation-forms/code/:formCode` - Get observation form by form code (e.g., G1-KH)
- **PATCH** `/observation-forms/:id` - Update observation form (Admin/Zone/Provincial only)
- **DELETE** `/observation-forms/:id` - Delete observation form (Admin only)

### Metadata & Filtering
- **GET** `/observation-forms/subjects` - Get all available subjects
- **GET** `/observation-forms/grades` - Get all available grades
- **GET** `/observation-forms/by-grade-subject` - Get forms by grade and subject
  - Query params: `grade` (required), `subject` (required)
- **GET** `/observation-forms/recommended` - Get recommended forms for current user
- **GET** `/observation-forms/:id/metadata` - Get form metadata and statistics
- **GET** `/observation-forms/:id/preview` - Get form preview for display
- **GET** `/observation-forms/:id/validate-completeness` - Validate form completeness and structure

### Template Management
- **GET** `/observation-forms/templates` - Get all available form templates
- **GET** `/observation-forms/templates/by-grade` - Get form templates by grade and optional subject
  - Query params: `grade` (required), `subject` (optional)
- **GET** `/observation-forms/templates/filtered` - Get available form templates by grade and subject
  - Query params: `grade` (required), `subject` (optional)
- **GET** `/observation-forms/templates/:formCode` - Get specific form template by code
- **POST** `/observation-forms/create-from-template` - Create a new form from a template
  - Body: `{ templateCode: string, customizations?: { title?: string, formCode?: string } }`

### Lesson Phases
- **GET** `/observation-forms/:id/phases` - Get lesson phases for a form
- **PATCH** `/observation-forms/:id/phases/order` - Update lesson phase order (Admin/Zone/Provincial only)
  - Body: `[{ id: string, sectionOrder: number }]`
- **GET** `/observation-forms/:id/validate` - Validate form structure

### Indicators
- **GET** `/observation-forms/indicators/:id` - Get indicator by ID
- **PATCH** `/observation-forms/indicators/:id/activate` - Activate indicator (Admin/Zone/Provincial only)
- **PATCH** `/observation-forms/indicators/:id/deactivate` - Deactivate indicator (Admin/Zone/Provincial only)
- **GET** `/observation-forms/indicators/:id/validate` - Validate indicator structure

## 2. Observation Sessions APIs (`/observation-sessions`)

### Session Management
- **POST** `/observation-sessions` - Create a new observation session
- **GET** `/observation-sessions` - Get all observation sessions with filtering and pagination
- **GET** `/observation-sessions/:id` - Get observation session by ID
- **PATCH** `/observation-sessions/:id` - Update observation session
- **DELETE** `/observation-sessions/:id` - Delete observation session

### Session Status & Workflow
- **PATCH** `/observation-sessions/:id/status` - Update session status
- **GET** `/observation-sessions/:id/workflow` - Get session workflow state
- **GET** `/observation-sessions/:id/progress` - Get session completion progress
- **POST** `/observation-sessions/:id/validate` - Validate session for completion
- **PATCH** `/observation-sessions/:id/auto-save` - Auto-save session data

### Response Management
- **GET** `/observation-sessions/:id/responses` - Get indicator responses for session
- **GET** `/observation-sessions/:id/responses/progress` - Get indicator response progress
- **POST** `/observation-sessions/:id/responses/validate` - Validate all indicator responses

### Approval Process
- **PATCH** `/observation-sessions/:id/approve` - Approve completed session (Supervisor only)
- **PATCH** `/observation-sessions/:id/reject` - Reject session and return to draft

### Statistics & Reports
- **GET** `/observation-sessions/statistics` - Get observation session statistics

## 3. Improvement Plans APIs (`/improvement-plans`)

### Plan Management
- **POST** `/improvement-plans` - Create a new improvement plan
- **GET** `/improvement-plans` - Get all improvement plans with filtering and pagination
- **GET** `/improvement-plans/:id` - Get improvement plan by ID
- **PATCH** `/improvement-plans/:id` - Update improvement plan
- **DELETE** `/improvement-plans/:id` - Delete improvement plan
- **GET** `/improvement-plans/session/:sessionId` - Get improvement plan by session ID

### Statistics & Tracking
- **GET** `/improvement-plans/statistics` - Get improvement plan statistics
- **GET** `/improvement-plans/upcoming-deadlines` - Get plans with upcoming deadlines
- **GET** `/improvement-plans/overdue` - Get overdue improvement plans

### Action Management
- **PATCH** `/improvement-plans/:id/actions/:actionId/complete` - Mark improvement action as completed
- **GET** `/improvement-plans/:id/actions` - Get actions for improvement plan

### Follow-up Management
- **POST** `/improvement-plans/:id/follow-ups/:followUpId/note` - Add note to follow-up activity
- **GET** `/improvement-plans/:id/follow-ups` - Get follow-up activities for improvement plan
- **PATCH** `/improvement-plans/:id/follow-ups/:followUpId/complete` - Mark follow-up activity as completed

### Notifications
- **GET** `/improvement-plans/notifications/my` - Get notifications for current user
- **GET** `/improvement-plans/notifications/unread-count` - Get unread notifications count
- **PATCH** `/improvement-plans/notifications/:notificationId/read` - Mark notification as read
- **PATCH** `/improvement-plans/notifications/mark-all-read` - Mark all notifications as read
- **POST** `/improvement-plans/notifications/custom` - Create custom notification

### Reports
- **GET** `/improvement-plans/reports/action-statistics` - Get action statistics

## 4. Hierarchy APIs (`/hierarchy`)

- **GET** `/hierarchy/user-info` - Get current user hierarchy information
- **GET** `/hierarchy/accessible-users` - Get users accessible to current user based on hierarchy
- **GET** `/hierarchy/breadcrumbs` - Get breadcrumb navigation for current user context
- **GET** `/hierarchy/location-scope` - Get location scope for current user
- **GET** `/hierarchy/managed-entities` - Get entities managed by current user
- **GET** `/hierarchy/geographic-entities/:type` - Get geographic entities by type within user scope
- **GET** `/hierarchy/validate-access/:entityType/:entityId` - Validate user access to specific entity
- **GET** `/hierarchy/data-summary` - Get data summary within user scope

## Authentication Required

All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Role-Based Access

Different endpoints have different role requirements:
- **Admin Only**: Delete operations
- **Admin/Zone/Provincial**: Create and update operations
- **All Authenticated Users**: Read operations

## Example Usage

### Get all observation forms for Grade 1
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://157.10.73.52:3001/api/v1/observation-forms?grade=1"
```

### Create a new observation session
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"formId": "...", "teacherId": "...", "observationDate": "..."}' \
  "http://157.10.73.52:3001/api/v1/observation-sessions"
```
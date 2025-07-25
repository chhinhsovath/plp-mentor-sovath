
# 🏗️ Nationwide Mentoring Platform — Technical Specs

## 🧱 1. System Overview

**Goal**: Digitize nationwide teacher mentoring forms (Grades 1–6), automate feedback loops, and enable role-based data access for MoEYS Cambodia.

---

## 🧩 2. Data Layer (PostgreSQL)

### 📦 Database Design
- UUIDs as primary keys
- Templates: `observation_forms`, `lesson_phases`, `indicators`
- Instances: `observation_sessions`, `indicator_responses`
- Arrays for hierarchy roles
- JSONB for extensibility (e.g., rubric descriptions)

### 🗂 Key Tables
- `users`, `roles`, `zones`, `schools`
- `observation_forms`, `observation_sessions`
- `improvement_plans`, `follow_up_activities`
- `role_hierarchy_access`

---

## 🧠 3. Access & Permissions Layer

### 🛂 Role-Based Hierarchy
- Each user has a `role` + `location_scope`
- `role_hierarchy_access` governs:
  - `can_view`
  - `manages`
  - `can_approve_missions`

### SQL Example:
```sql
SELECT * FROM observation_sessions
WHERE cluster_id IN (
  SELECT id FROM clusters WHERE department_id = :user_department_id
);
```

---

## 🧮 4. Business Logic (Backend/API)

### 🧰 Stack:
- NestJS (Node.js + TypeScript)
- PostgreSQL via TypeORM
- REST API (initially) or GraphQL
- JWT authentication

### 📌 Key Endpoints:
```
/auth/login
/users/:id
/forms/
/sessions/
/improvement/
/signatures/
/hierarchy/
```

### Workflow:
1. Observer selects teacher & session
2. Fills indicators, reflections
3. Saves improvement plan (if needed)
4. Signs & submits
5. Reviewed by higher role if applicable

---

## 🎨 5. Frontend/UI Layer (React + MUI + Vite)

### 🔧 Stack:
- React 18 + Vite
- Material UI (MUI)
- React Hook Form + Zod
- TanStack Query
- Khmer-first (i18n-ready)

### 📋 Components:
| Component        | Purpose                                |
|------------------|----------------------------------------|
| ObservationForm  | Dynamic layout per grade/subject       |
| IndicatorTable   | Grid interface for score entry         |
| RubricSelector   | 1–3 scale / checkbox rubric            |
| ReflectionBox    | Text-based strengths/challenges        |
| SignaturePanel   | Teacher & observer signature fields    |
| PlanEditor       | Editable post-observation plan         |
| HierarchyFilter  | Role-scoped entity selector            |

---

## 🧪 6. Testing & Deployment

### Testing:
- Backend: Jest (unit + integration)
- Frontend: Playwright or Cypress

### Deployment:
- DB: Supabase or DigitalOcean PostgreSQL
- Frontend: Vercel or Netlify
- Backend: Fly.io / VPS / Docker + PM2

---

## 📘 Summary Table

| Area         | Technology         | Notes                           |
|--------------|--------------------|----------------------------------|
| DB           | PostgreSQL         | UUIDs, foreign keys, JSONB       |
| Backend      | NestJS + TypeORM   | Scalable, modular API            |
| Frontend     | React + Vite + MUI | Component-based UI               |
| Auth         | JWT                | Role-secure login                |
| Role Logic   | SQL + Middleware   | Hierarchical permissions         |
| Language     | Khmer + i18n       | Nationwide compatibility         |
| Docs         | Swagger/Postman    | For API reference                |
| Deployment   | GitHub + PM2       | Container or VPS support         |

---

## 🔜 Optional Add-ons

- GitHub project board for planning
- Figma UI or Tailwind mockups
- Excel sheet for form-indicator mappings


-- =========================
-- Table: observation_forms
-- =========================
CREATE TABLE observation_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_code TEXT UNIQUE,
    title TEXT,
    subject TEXT,
    grade_range TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- Table: observation_sessions
-- ===========================
CREATE TABLE observation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES observation_forms(id),
    school_name TEXT,
    teacher_name TEXT,
    observer_name TEXT,
    subject TEXT,
    grade TEXT,
    date_observed DATE,
    start_time TIME,
    end_time TIME,
    classification_level TEXT,
    reflection_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================
-- Table: lesson_phases
-- =======================
CREATE TABLE lesson_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES observation_forms(id),
    title TEXT,
    section_order INTEGER
);

-- =============================
-- Table: competency_domains
-- =============================
CREATE TABLE competency_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES observation_forms(id),
    subject TEXT,
    domain_name TEXT
);

-- ===================
-- Table: indicators
-- ===================
CREATE TABLE indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID REFERENCES lesson_phases(id),
    domain_id UUID REFERENCES competency_domains(id),
    indicator_number TEXT,
    indicator_text TEXT,
    max_score INTEGER,
    rubric_type TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================
-- Table: indicator_scales
-- ============================
CREATE TABLE indicator_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator_id UUID REFERENCES indicators(id),
    scale_label TEXT,
    scale_description TEXT
);

-- ===============================
-- Table: indicator_responses
-- ===============================
CREATE TABLE indicator_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES observation_sessions(id),
    indicator_id UUID REFERENCES indicators(id),
    selected_score INTEGER,
    selected_level TEXT,
    notes TEXT
);

-- ==============================
-- Table: group_reflection_comments
-- ==============================
CREATE TABLE group_reflection_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES observation_sessions(id),
    comment_type TEXT,
    comment_content TEXT
);

-- ============================
-- Table: improvement_plans
-- ============================
CREATE TABLE improvement_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES observation_sessions(id),
    lesson_topic TEXT,
    challenges TEXT,
    strengths TEXT,
    notes TEXT
);

-- ==============================
-- Table: improvement_actions
-- ==============================
CREATE TABLE improvement_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES improvement_plans(id),
    action_description TEXT,
    responsible_person TEXT,
    deadline DATE
);

-- =============================
-- Table: follow_up_activities
-- =============================
CREATE TABLE follow_up_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES improvement_plans(id),
    follow_up_date DATE,
    method TEXT,
    comments TEXT
);

-- ====================
-- Table: signatures
-- ====================
CREATE TABLE signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES observation_sessions(id),
    role TEXT,
    signer_name TEXT,
    signed_date DATE
);

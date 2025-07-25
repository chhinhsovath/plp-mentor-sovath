import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "full_name" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'Teacher',
        "location_scope" character varying,
        "zone_id" character varying,
        "province_id" character varying,
        "department_id" character varying,
        "cluster_id" character varying,
        "school_id" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "last_login" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    // Create role_hierarchy_access table
    await queryRunner.query(`
      CREATE TABLE "role_hierarchy_access" (
        "id" SERIAL NOT NULL,
        "role" character varying NOT NULL,
        "can_view" character varying NOT NULL,
        "manages" text array NOT NULL,
        "can_approve_missions" boolean NOT NULL,
        "notes" character varying,
        CONSTRAINT "PK_role_hierarchy_access_id" PRIMARY KEY ("id")
      )
    `);

    // Create observation_forms table
    await queryRunner.query(`
      CREATE TABLE "observation_forms" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "form_code" character varying NOT NULL,
        "title" character varying NOT NULL,
        "subject" character varying NOT NULL,
        "grade_range" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_observation_forms_form_code" UNIQUE ("form_code"),
        CONSTRAINT "PK_observation_forms_id" PRIMARY KEY ("id")
      )
    `);

    // Create lesson_phases table
    await queryRunner.query(`
      CREATE TABLE "lesson_phases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "form_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "section_order" integer NOT NULL,
        CONSTRAINT "PK_lesson_phases_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lesson_phases_form_id" FOREIGN KEY ("form_id") REFERENCES "observation_forms"("id") ON DELETE CASCADE
      )
    `);

    // Create competency_domains table
    await queryRunner.query(`
      CREATE TABLE "competency_domains" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "form_id" uuid NOT NULL,
        "subject" character varying NOT NULL,
        "domain_name" character varying NOT NULL,
        CONSTRAINT "PK_competency_domains_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_competency_domains_form_id" FOREIGN KEY ("form_id") REFERENCES "observation_forms"("id") ON DELETE CASCADE
      )
    `);

    // Create indicators table
    await queryRunner.query(`
      CREATE TABLE "indicators" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "phase_id" uuid,
        "domain_id" uuid,
        "indicator_number" character varying NOT NULL,
        "indicator_text" character varying NOT NULL,
        "max_score" integer NOT NULL,
        "rubric_type" character varying NOT NULL DEFAULT 'scale',
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_indicators_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_indicators_phase_id" FOREIGN KEY ("phase_id") REFERENCES "lesson_phases"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_indicators_domain_id" FOREIGN KEY ("domain_id") REFERENCES "competency_domains"("id") ON DELETE CASCADE
      )
    `);

    // Create indicator_scales table
    await queryRunner.query(`
      CREATE TABLE "indicator_scales" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "indicator_id" uuid NOT NULL,
        "scale_label" character varying NOT NULL,
        "scale_description" character varying NOT NULL,
        CONSTRAINT "PK_indicator_scales_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_indicator_scales_indicator_id" FOREIGN KEY ("indicator_id") REFERENCES "indicators"("id") ON DELETE CASCADE
      )
    `);

    // Create observation_sessions table
    await queryRunner.query(`
      CREATE TABLE "observation_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "form_id" uuid NOT NULL,
        "observer_id" uuid,
        "school_name" character varying NOT NULL,
        "teacher_name" character varying NOT NULL,
        "observer_name" character varying NOT NULL,
        "subject" character varying NOT NULL,
        "grade" character varying NOT NULL,
        "date_observed" date NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "classification_level" character varying NOT NULL,
        "reflection_summary" text,
        "status" character varying NOT NULL DEFAULT 'draft',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_observation_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_observation_sessions_form_id" FOREIGN KEY ("form_id") REFERENCES "observation_forms"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_observation_sessions_observer_id" FOREIGN KEY ("observer_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Create indicator_responses table
    await queryRunner.query(`
      CREATE TABLE "indicator_responses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "indicator_id" uuid NOT NULL,
        "selected_score" integer,
        "selected_level" character varying,
        "notes" text,
        CONSTRAINT "PK_indicator_responses_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_indicator_responses_session_id" FOREIGN KEY ("session_id") REFERENCES "observation_sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_indicator_responses_indicator_id" FOREIGN KEY ("indicator_id") REFERENCES "indicators"("id") ON DELETE CASCADE
      )
    `);

    // Create group_reflection_comments table
    await queryRunner.query(`
      CREATE TABLE "group_reflection_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "comment_type" character varying NOT NULL,
        "comment_content" text NOT NULL,
        CONSTRAINT "PK_group_reflection_comments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_group_reflection_comments_session_id" FOREIGN KEY ("session_id") REFERENCES "observation_sessions"("id") ON DELETE CASCADE
      )
    `);

    // Create improvement_plans table
    await queryRunner.query(`
      CREATE TABLE "improvement_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "lesson_topic" character varying,
        "goals" text,
        "challenges" text,
        "strengths" text,
        "notes" text,
        "timeline" character varying,
        "responsible_party" character varying,
        "status" character varying NOT NULL DEFAULT 'draft',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_improvement_plans_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_improvement_plans_session_id" FOREIGN KEY ("session_id") REFERENCES "observation_sessions"("id") ON DELETE CASCADE
      )
    `);

    // Create improvement_actions table
    await queryRunner.query(`
      CREATE TABLE "improvement_actions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plan_id" uuid NOT NULL,
        "action_description" text NOT NULL,
        "responsible_person" character varying NOT NULL,
        "deadline" date NOT NULL,
        CONSTRAINT "PK_improvement_actions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_improvement_actions_plan_id" FOREIGN KEY ("plan_id") REFERENCES "improvement_plans"("id") ON DELETE CASCADE
      )
    `);

    // Create follow_up_activities table
    await queryRunner.query(`
      CREATE TABLE "follow_up_activities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plan_id" uuid NOT NULL,
        "description" text NOT NULL,
        "due_date" date NOT NULL,
        "assigned_to" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "completed_at" TIMESTAMP,
        "notes" text,
        "follow_up_date" date,
        "method" character varying,
        "comments" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_follow_up_activities_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_follow_up_activities_plan_id" FOREIGN KEY ("plan_id") REFERENCES "improvement_plans"("id") ON DELETE CASCADE
      )
    `);

    // Create signatures table
    await queryRunner.query(`
      CREATE TABLE "signatures" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "role" character varying NOT NULL,
        "signer_name" character varying NOT NULL,
        "signature_data" text,
        "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "ip_address" character varying,
        "is_valid" boolean NOT NULL DEFAULT true,
        "signed_date" date NOT NULL,
        CONSTRAINT "PK_signatures_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_signatures_session_id" FOREIGN KEY ("session_id") REFERENCES "observation_sessions"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for performance optimization
    // User-related indexes
    await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_location_scope" ON "users" ("location_scope")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_zone_id" ON "users" ("zone_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_province_id" ON "users" ("province_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_department_id" ON "users" ("department_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_cluster_id" ON "users" ("cluster_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_school_id" ON "users" ("school_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_is_active" ON "users" ("is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_created_at" ON "users" ("created_at")`);
    
    // Observation session indexes
    await queryRunner.query(`CREATE INDEX "IDX_observation_sessions_date_observed" ON "observation_sessions" ("date_observed")`);
    await queryRunner.query(`CREATE INDEX "IDX_observation_sessions_status" ON "observation_sessions" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_observation_sessions_observer_id" ON "observation_sessions" ("observer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_observation_sessions_form_id" ON "observation_sessions" ("form_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_observation_sessions_subject" ON "observation_sessions" ("subject")`);
    await queryRunner.query(`CREATE INDEX "IDX_observation_sessions_grade" ON "observation_sessions" ("grade")`);
    await queryRunner.query(`CREATE INDEX "IDX_observation_sessions_created_at" ON "observation_sessions" ("created_at")`);
    
    // Observation form indexes
    await queryRunner.query(`CREATE INDEX "IDX_observation_forms_subject" ON "observation_forms" ("subject")`);
    await queryRunner.query(`CREATE INDEX "IDX_observation_forms_grade_range" ON "observation_forms" ("grade_range")`);
    
    // Indicator indexes
    await queryRunner.query(`CREATE INDEX "IDX_indicators_rubric_type" ON "indicators" ("rubric_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_indicators_is_active" ON "indicators" ("is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_indicators_phase_id" ON "indicators" ("phase_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_indicators_domain_id" ON "indicators" ("domain_id")`);
    
    // Lesson phase indexes
    await queryRunner.query(`CREATE INDEX "IDX_lesson_phases_form_id" ON "lesson_phases" ("form_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_lesson_phases_section_order" ON "lesson_phases" ("section_order")`);
    
    // Competency domain indexes
    await queryRunner.query(`CREATE INDEX "IDX_competency_domains_form_id" ON "competency_domains" ("form_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_competency_domains_subject" ON "competency_domains" ("subject")`);
    
    // Indicator response indexes
    await queryRunner.query(`CREATE INDEX "IDX_indicator_responses_session_id" ON "indicator_responses" ("session_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_indicator_responses_indicator_id" ON "indicator_responses" ("indicator_id")`);
    
    // Improvement plan indexes
    await queryRunner.query(`CREATE INDEX "IDX_improvement_plans_session_id" ON "improvement_plans" ("session_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_improvement_plans_status" ON "improvement_plans" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_improvement_plans_responsible_party" ON "improvement_plans" ("responsible_party")`);
    await queryRunner.query(`CREATE INDEX "IDX_improvement_plans_created_at" ON "improvement_plans" ("created_at")`);
    
    // Improvement action indexes
    await queryRunner.query(`CREATE INDEX "IDX_improvement_actions_plan_id" ON "improvement_actions" ("plan_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_improvement_actions_deadline" ON "improvement_actions" ("deadline")`);
    
    // Follow-up activity indexes
    await queryRunner.query(`CREATE INDEX "IDX_follow_up_activities_plan_id" ON "follow_up_activities" ("plan_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_follow_up_activities_due_date" ON "follow_up_activities" ("due_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_follow_up_activities_status" ON "follow_up_activities" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_follow_up_activities_assigned_to" ON "follow_up_activities" ("assigned_to")`);
    await queryRunner.query(`CREATE INDEX "IDX_follow_up_activities_follow_up_date" ON "follow_up_activities" ("follow_up_date")`);
    
    // Signature indexes
    await queryRunner.query(`CREATE INDEX "IDX_signatures_session_id" ON "signatures" ("session_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_signatures_role" ON "signatures" ("role")`);
    await queryRunner.query(`CREATE INDEX "IDX_signatures_signed_date" ON "signatures" ("signed_date")`);
    
    // Group reflection comment indexes
    await queryRunner.query(`CREATE INDEX "IDX_group_reflection_comments_session_id" ON "group_reflection_comments" ("session_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_group_reflection_comments_comment_type" ON "group_reflection_comments" ("comment_type")`);
    
    // Indicator scale indexes
    await queryRunner.query(`CREATE INDEX "IDX_indicator_scales_indicator_id" ON "indicator_scales" ("indicator_id")`);
    
    // Role hierarchy access indexes
    await queryRunner.query(`CREATE INDEX "IDX_role_hierarchy_access_role" ON "role_hierarchy_access" ("role")`);
    await queryRunner.query(`CREATE INDEX "IDX_role_hierarchy_access_can_approve_missions" ON "role_hierarchy_access" ("can_approve_missions")`);
    
    // Composite indexes for common query patterns
    await queryRunner.query(`CREATE INDEX "IDX_users_role_location_scope" ON "users" ("role", "location_scope")`);
    await queryRunner.query(`CREATE INDEX "IDX_observation_sessions_status_date" ON "observation_sessions" ("status", "date_observed")`);
    await queryRunner.query(`CREATE INDEX "IDX_observation_sessions_observer_status" ON "observation_sessions" ("observer_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_indicators_phase_active" ON "indicators" ("phase_id", "is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_indicators_domain_active" ON "indicators" ("domain_id", "is_active")`);
    
    // Full-text search indexes for Khmer text
    await queryRunner.query(`CREATE INDEX "IDX_users_full_name_gin" ON "users" USING gin(to_tsvector('simple', "full_name"))`);
    await queryRunner.query(`CREATE INDEX "IDX_observation_sessions_teacher_name_gin" ON "observation_sessions" USING gin(to_tsvector('simple', "teacher_name"))`);
    await queryRunner.query(`CREATE INDEX "IDX_observation_sessions_school_name_gin" ON "observation_sessions" USING gin(to_tsvector('simple', "school_name"))`);
    await queryRunner.query(`CREATE INDEX "IDX_indicators_text_gin" ON "indicators" USING gin(to_tsvector('simple', "indicator_text"))`);
    await queryRunner.query(`CREATE INDEX "IDX_observation_forms_title_gin" ON "observation_forms" USING gin(to_tsvector('simple', "title"))`);
    
    // Partial indexes for active records
    await queryRunner.query(`CREATE INDEX "IDX_users_active_role" ON "users" ("role") WHERE "is_active" = true`);
    await queryRunner.query(`CREATE INDEX "IDX_indicators_active_phase" ON "indicators" ("phase_id") WHERE "is_active" = true`);
    await queryRunner.query(`CREATE INDEX "IDX_indicators_active_domain" ON "indicators" ("domain_id") WHERE "is_active" = true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop partial indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_indicators_active_domain"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_indicators_active_phase"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_active_role"`);
    
    // Drop full-text search indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_observation_forms_title_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_indicators_text_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_observation_sessions_school_name_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_observation_sessions_teacher_name_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_full_name_gin"`);
    
    // Drop composite indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_indicators_domain_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_indicators_phase_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_observation_sessions_observer_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_observation_sessions_status_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role_location_scope"`);
    
    // Drop single column indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_role_hierarchy_access_can_approve_missions"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_role_hierarchy_access_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_indicator_scales_indicator_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_group_reflection_comments_comment_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_group_reflection_comments_session_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_signatures_signed_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_signatures_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_signatures_session_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_follow_up_activities_follow_up_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_follow_up_activities_assigned_to"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_follow_up_activities_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_follow_up_activities_due_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_follow_up_activities_plan_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_improvement_actions_deadline"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_improvement_actions_plan_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_improvement_plans_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_improvement_plans_responsible_party"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_improvement_plans_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_improvement_plans_session_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_indicator_responses_indicator_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_indicator_responses_session_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_competency_domains_subject"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_competency_domains_form_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lesson_phases_section_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lesson_phases_form_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_indicators_domain_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_indicators_phase_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_indicators_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_indicators_rubric_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_observation_forms_grade_range"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_observation_forms_subject"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_observation_sessions_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_observation_sessions_grade"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_observation_sessions_subject"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_observation_sessions_form_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_observation_sessions_observer_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_observation_sessions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_observation_sessions_date_observed"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_school_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_cluster_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_department_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_province_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_zone_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_location_scope"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role"`);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "signatures"`);
    await queryRunner.query(`DROP TABLE "follow_up_activities"`);
    await queryRunner.query(`DROP TABLE "improvement_actions"`);
    await queryRunner.query(`DROP TABLE "improvement_plans"`);
    await queryRunner.query(`DROP TABLE "group_reflection_comments"`);
    await queryRunner.query(`DROP TABLE "indicator_responses"`);
    await queryRunner.query(`DROP TABLE "observation_sessions"`);
    await queryRunner.query(`DROP TABLE "indicator_scales"`);
    await queryRunner.query(`DROP TABLE "indicators"`);
    await queryRunner.query(`DROP TABLE "competency_domains"`);
    await queryRunner.query(`DROP TABLE "lesson_phases"`);
    await queryRunner.query(`DROP TABLE "observation_forms"`);
    await queryRunner.query(`DROP TABLE "role_hierarchy_access"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}

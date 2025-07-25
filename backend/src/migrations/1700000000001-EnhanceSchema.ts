import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceSchema1700000000001 implements MigrationInterface {
  name = 'EnhanceSchema1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns already exist before adding them
    
    // Enhance signatures table
    const signaturesTableExists = await queryRunner.hasTable('signatures');
    if (signaturesTableExists) {
      const hasSignatureData = await queryRunner.hasColumn('signatures', 'signature_data');
      if (!hasSignatureData) {
        await queryRunner.query(`ALTER TABLE "signatures" ADD COLUMN "signature_data" text`);
      }
      
      const hasTimestamp = await queryRunner.hasColumn('signatures', 'timestamp');
      if (!hasTimestamp) {
        await queryRunner.query(`ALTER TABLE "signatures" ADD COLUMN "timestamp" TIMESTAMP NOT NULL DEFAULT now()`);
      }
      
      const hasIpAddress = await queryRunner.hasColumn('signatures', 'ip_address');
      if (!hasIpAddress) {
        await queryRunner.query(`ALTER TABLE "signatures" ADD COLUMN "ip_address" character varying`);
      }
      
      const hasIsValid = await queryRunner.hasColumn('signatures', 'is_valid');
      if (!hasIsValid) {
        await queryRunner.query(`ALTER TABLE "signatures" ADD COLUMN "is_valid" boolean NOT NULL DEFAULT true`);
      }
    }

    // Enhance improvement_plans table
    const improvementPlansTableExists = await queryRunner.hasTable('improvement_plans');
    if (improvementPlansTableExists) {
      const hasGoals = await queryRunner.hasColumn('improvement_plans', 'goals');
      if (!hasGoals) {
        await queryRunner.query(`ALTER TABLE "improvement_plans" ADD COLUMN "goals" text`);
      }
      
      const hasTimeline = await queryRunner.hasColumn('improvement_plans', 'timeline');
      if (!hasTimeline) {
        await queryRunner.query(`ALTER TABLE "improvement_plans" ADD COLUMN "timeline" character varying`);
      }
      
      const hasResponsibleParty = await queryRunner.hasColumn('improvement_plans', 'responsible_party');
      if (!hasResponsibleParty) {
        await queryRunner.query(`ALTER TABLE "improvement_plans" ADD COLUMN "responsible_party" character varying`);
      }
      
      const hasStatus = await queryRunner.hasColumn('improvement_plans', 'status');
      if (!hasStatus) {
        await queryRunner.query(`ALTER TABLE "improvement_plans" ADD COLUMN "status" character varying NOT NULL DEFAULT 'draft'`);
      }
      
      const hasCreatedAt = await queryRunner.hasColumn('improvement_plans', 'created_at');
      if (!hasCreatedAt) {
        await queryRunner.query(`ALTER TABLE "improvement_plans" ADD COLUMN "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
      }
      
      const hasUpdatedAt = await queryRunner.hasColumn('improvement_plans', 'updated_at');
      if (!hasUpdatedAt) {
        await queryRunner.query(`ALTER TABLE "improvement_plans" ADD COLUMN "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
      }
    }

    // Enhance follow_up_activities table
    const followUpActivitiesTableExists = await queryRunner.hasTable('follow_up_activities');
    if (followUpActivitiesTableExists) {
      const hasDescription = await queryRunner.hasColumn('follow_up_activities', 'description');
      if (!hasDescription) {
        await queryRunner.query(`ALTER TABLE "follow_up_activities" ADD COLUMN "description" text NOT NULL DEFAULT 'Follow-up activity'`);
      }
      
      const hasDueDate = await queryRunner.hasColumn('follow_up_activities', 'due_date');
      if (!hasDueDate) {
        await queryRunner.query(`ALTER TABLE "follow_up_activities" ADD COLUMN "due_date" date NOT NULL DEFAULT CURRENT_DATE`);
      }
      
      const hasAssignedTo = await queryRunner.hasColumn('follow_up_activities', 'assigned_to');
      if (!hasAssignedTo) {
        await queryRunner.query(`ALTER TABLE "follow_up_activities" ADD COLUMN "assigned_to" character varying NOT NULL DEFAULT 'Unassigned'`);
      }
      
      const hasStatus = await queryRunner.hasColumn('follow_up_activities', 'status');
      if (!hasStatus) {
        await queryRunner.query(`ALTER TABLE "follow_up_activities" ADD COLUMN "status" character varying NOT NULL DEFAULT 'pending'`);
      }
      
      const hasCompletedAt = await queryRunner.hasColumn('follow_up_activities', 'completed_at');
      if (!hasCompletedAt) {
        await queryRunner.query(`ALTER TABLE "follow_up_activities" ADD COLUMN "completed_at" TIMESTAMP`);
      }
      
      const hasNotes = await queryRunner.hasColumn('follow_up_activities', 'notes');
      if (!hasNotes) {
        await queryRunner.query(`ALTER TABLE "follow_up_activities" ADD COLUMN "notes" text`);
      }
      
      const hasCreatedAt = await queryRunner.hasColumn('follow_up_activities', 'created_at');
      if (!hasCreatedAt) {
        await queryRunner.query(`ALTER TABLE "follow_up_activities" ADD COLUMN "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
      }
      
      const hasUpdatedAt = await queryRunner.hasColumn('follow_up_activities', 'updated_at');
      if (!hasUpdatedAt) {
        await queryRunner.query(`ALTER TABLE "follow_up_activities" ADD COLUMN "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
      }
    }

    // Create additional indexes for performance (only if they don't exist)
    const indexQueries = [
      // Signature indexes
      `CREATE INDEX IF NOT EXISTS "IDX_signatures_timestamp" ON "signatures" ("timestamp")`,
      `CREATE INDEX IF NOT EXISTS "IDX_signatures_is_valid" ON "signatures" ("is_valid")`,
      
      // Improvement plan indexes
      `CREATE INDEX IF NOT EXISTS "IDX_improvement_plans_status" ON "improvement_plans" ("status")`,
      `CREATE INDEX IF NOT EXISTS "IDX_improvement_plans_responsible_party" ON "improvement_plans" ("responsible_party")`,
      `CREATE INDEX IF NOT EXISTS "IDX_improvement_plans_created_at" ON "improvement_plans" ("created_at")`,
      
      // Follow-up activity indexes
      `CREATE INDEX IF NOT EXISTS "IDX_follow_up_activities_due_date" ON "follow_up_activities" ("due_date")`,
      `CREATE INDEX IF NOT EXISTS "IDX_follow_up_activities_status" ON "follow_up_activities" ("status")`,
      `CREATE INDEX IF NOT EXISTS "IDX_follow_up_activities_assigned_to" ON "follow_up_activities" ("assigned_to")`,
      
      // Additional performance indexes
      `CREATE INDEX IF NOT EXISTS "IDX_users_zone_id" ON "users" ("zone_id")`,
      `CREATE INDEX IF NOT EXISTS "IDX_users_province_id" ON "users" ("province_id")`,
      `CREATE INDEX IF NOT EXISTS "IDX_users_department_id" ON "users" ("department_id")`,
      `CREATE INDEX IF NOT EXISTS "IDX_users_cluster_id" ON "users" ("cluster_id")`,
      `CREATE INDEX IF NOT EXISTS "IDX_users_school_id" ON "users" ("school_id")`,
      `CREATE INDEX IF NOT EXISTS "IDX_users_is_active" ON "users" ("is_active")`,
      `CREATE INDEX IF NOT EXISTS "IDX_users_created_at" ON "users" ("created_at")`,
      
      // Observation session indexes
      `CREATE INDEX IF NOT EXISTS "IDX_observation_sessions_form_id" ON "observation_sessions" ("form_id")`,
      `CREATE INDEX IF NOT EXISTS "IDX_observation_sessions_subject" ON "observation_sessions" ("subject")`,
      `CREATE INDEX IF NOT EXISTS "IDX_observation_sessions_grade" ON "observation_sessions" ("grade")`,
      `CREATE INDEX IF NOT EXISTS "IDX_observation_sessions_created_at" ON "observation_sessions" ("created_at")`,
      
      // Observation form indexes
      `CREATE INDEX IF NOT EXISTS "IDX_observation_forms_subject" ON "observation_forms" ("subject")`,
      `CREATE INDEX IF NOT EXISTS "IDX_observation_forms_grade_range" ON "observation_forms" ("grade_range")`,
      
      // Indicator indexes
      `CREATE INDEX IF NOT EXISTS "IDX_indicators_phase_id" ON "indicators" ("phase_id")`,
      `CREATE INDEX IF NOT EXISTS "IDX_indicators_domain_id" ON "indicators" ("domain_id")`,
      
      // Lesson phase indexes
      `CREATE INDEX IF NOT EXISTS "IDX_lesson_phases_form_id" ON "lesson_phases" ("form_id")`,
      `CREATE INDEX IF NOT EXISTS "IDX_lesson_phases_section_order" ON "lesson_phases" ("section_order")`,
      
      // Competency domain indexes
      `CREATE INDEX IF NOT EXISTS "IDX_competency_domains_form_id" ON "competency_domains" ("form_id")`,
      `CREATE INDEX IF NOT EXISTS "IDX_competency_domains_subject" ON "competency_domains" ("subject")`,
      
      // Indicator response indexes
      `CREATE INDEX IF NOT EXISTS "IDX_indicator_responses_session_id" ON "indicator_responses" ("session_id")`,
      `CREATE INDEX IF NOT EXISTS "IDX_indicator_responses_indicator_id" ON "indicator_responses" ("indicator_id")`,
      
      // Improvement action indexes
      `CREATE INDEX IF NOT EXISTS "IDX_improvement_actions_plan_id" ON "improvement_actions" ("plan_id")`,
      `CREATE INDEX IF NOT EXISTS "IDX_improvement_actions_deadline" ON "improvement_actions" ("deadline")`,
      
      // Group reflection comment indexes
      `CREATE INDEX IF NOT EXISTS "IDX_group_reflection_comments_session_id" ON "group_reflection_comments" ("session_id")`,
      `CREATE INDEX IF NOT EXISTS "IDX_group_reflection_comments_comment_type" ON "group_reflection_comments" ("comment_type")`,
      
      // Indicator scale indexes
      `CREATE INDEX IF NOT EXISTS "IDX_indicator_scales_indicator_id" ON "indicator_scales" ("indicator_id")`,
      
      // Role hierarchy access indexes
      `CREATE INDEX IF NOT EXISTS "IDX_role_hierarchy_access_role" ON "role_hierarchy_access" ("role")`,
      `CREATE INDEX IF NOT EXISTS "IDX_role_hierarchy_access_can_approve_missions" ON "role_hierarchy_access" ("can_approve_missions")`,
      
      // Composite indexes for common query patterns
      `CREATE INDEX IF NOT EXISTS "IDX_users_role_location_scope" ON "users" ("role", "location_scope")`,
      `CREATE INDEX IF NOT EXISTS "IDX_observation_sessions_status_date" ON "observation_sessions" ("status", "date_observed")`,
      `CREATE INDEX IF NOT EXISTS "IDX_observation_sessions_observer_status" ON "observation_sessions" ("observer_id", "status")`,
      `CREATE INDEX IF NOT EXISTS "IDX_indicators_phase_active" ON "indicators" ("phase_id", "is_active")`,
      `CREATE INDEX IF NOT EXISTS "IDX_indicators_domain_active" ON "indicators" ("domain_id", "is_active")`,
    ];

    for (const indexQuery of indexQueries) {
      try {
        await queryRunner.query(indexQuery);
      } catch (error) {
        // Index might already exist, continue
        console.log(`Index creation skipped: ${error.message}`);
      }
    }

    // Create full-text search indexes for Khmer text (only if they don't exist)
    const fullTextIndexes = [
      `CREATE INDEX IF NOT EXISTS "IDX_users_full_name_gin" ON "users" USING gin(to_tsvector('simple', "full_name"))`,
      `CREATE INDEX IF NOT EXISTS "IDX_observation_sessions_teacher_name_gin" ON "observation_sessions" USING gin(to_tsvector('simple', "teacher_name"))`,
      `CREATE INDEX IF NOT EXISTS "IDX_observation_sessions_school_name_gin" ON "observation_sessions" USING gin(to_tsvector('simple', "school_name"))`,
      `CREATE INDEX IF NOT EXISTS "IDX_indicators_text_gin" ON "indicators" USING gin(to_tsvector('simple', "indicator_text"))`,
      `CREATE INDEX IF NOT EXISTS "IDX_observation_forms_title_gin" ON "observation_forms" USING gin(to_tsvector('simple', "title"))`,
    ];

    for (const indexQuery of fullTextIndexes) {
      try {
        await queryRunner.query(indexQuery);
      } catch (error) {
        // Index might already exist or GIN extension not available, continue
        console.log(`Full-text index creation skipped: ${error.message}`);
      }
    }

    // Create partial indexes for active records
    const partialIndexes = [
      `CREATE INDEX IF NOT EXISTS "IDX_users_active_role" ON "users" ("role") WHERE "is_active" = true`,
      `CREATE INDEX IF NOT EXISTS "IDX_indicators_active_phase" ON "indicators" ("phase_id") WHERE "is_active" = true`,
      `CREATE INDEX IF NOT EXISTS "IDX_indicators_active_domain" ON "indicators" ("domain_id") WHERE "is_active" = true`,
    ];

    for (const indexQuery of partialIndexes) {
      try {
        await queryRunner.query(indexQuery);
      } catch (error) {
        // Index might already exist, continue
        console.log(`Partial index creation skipped: ${error.message}`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove added columns
    const signaturesTableExists = await queryRunner.hasTable('signatures');
    if (signaturesTableExists) {
      const hasSignatureData = await queryRunner.hasColumn('signatures', 'signature_data');
      if (hasSignatureData) {
        await queryRunner.query(`ALTER TABLE "signatures" DROP COLUMN "signature_data"`);
      }
      
      const hasTimestamp = await queryRunner.hasColumn('signatures', 'timestamp');
      if (hasTimestamp) {
        await queryRunner.query(`ALTER TABLE "signatures" DROP COLUMN "timestamp"`);
      }
      
      const hasIpAddress = await queryRunner.hasColumn('signatures', 'ip_address');
      if (hasIpAddress) {
        await queryRunner.query(`ALTER TABLE "signatures" DROP COLUMN "ip_address"`);
      }
      
      const hasIsValid = await queryRunner.hasColumn('signatures', 'is_valid');
      if (hasIsValid) {
        await queryRunner.query(`ALTER TABLE "signatures" DROP COLUMN "is_valid"`);
      }
    }

    // Remove improvement plan enhancements
    const improvementPlansTableExists = await queryRunner.hasTable('improvement_plans');
    if (improvementPlansTableExists) {
      const columns = ['goals', 'timeline', 'responsible_party', 'status', 'created_at', 'updated_at'];
      for (const column of columns) {
        const hasColumn = await queryRunner.hasColumn('improvement_plans', column);
        if (hasColumn) {
          await queryRunner.query(`ALTER TABLE "improvement_plans" DROP COLUMN "${column}"`);
        }
      }
    }

    // Remove follow-up activity enhancements
    const followUpActivitiesTableExists = await queryRunner.hasTable('follow_up_activities');
    if (followUpActivitiesTableExists) {
      const columns = ['description', 'due_date', 'assigned_to', 'status', 'completed_at', 'notes', 'created_at', 'updated_at'];
      for (const column of columns) {
        const hasColumn = await queryRunner.hasColumn('follow_up_activities', column);
        if (hasColumn && !['follow_up_date', 'method', 'comments'].includes(column)) {
          await queryRunner.query(`ALTER TABLE "follow_up_activities" DROP COLUMN "${column}"`);
        }
      }
    }

    // Drop indexes (they will be recreated if needed)
    const indexesToDrop = [
      'IDX_signatures_timestamp',
      'IDX_signatures_is_valid',
      'IDX_improvement_plans_status',
      'IDX_improvement_plans_responsible_party',
      'IDX_improvement_plans_created_at',
      'IDX_follow_up_activities_due_date',
      'IDX_follow_up_activities_status',
      'IDX_follow_up_activities_assigned_to',
    ];

    for (const indexName of indexesToDrop) {
      try {
        await queryRunner.query(`DROP INDEX IF EXISTS "${indexName}"`);
      } catch (error) {
        // Index might not exist, continue
      }
    }
  }
}
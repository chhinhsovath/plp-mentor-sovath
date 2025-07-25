import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSurveyTables1700000000003 implements MigrationInterface {
  name = 'AddSurveyTables1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create surveys table
    await queryRunner.query(`
      CREATE TABLE "surveys" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "description" text,
        "settings" jsonb,
        "status" character varying NOT NULL DEFAULT 'draft',
        "metadata" jsonb,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_surveys_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_surveys" PRIMARY KEY ("id")
      )
    `);

    // Create index on slug
    await queryRunner.query(`CREATE INDEX "IDX_surveys_slug" ON "surveys" ("slug")`);

    // Create questions table
    await queryRunner.query(`
      CREATE TABLE "questions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "survey_id" uuid NOT NULL,
        "type" character varying(50) NOT NULL,
        "label" text NOT NULL,
        "description" text,
        "placeholder" text,
        "required" boolean NOT NULL DEFAULT false,
        "order" integer NOT NULL,
        "options" jsonb,
        "validation" jsonb,
        "logic" jsonb,
        "parent_question_id" uuid,
        "group_id" character varying,
        "allow_other" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        CONSTRAINT "PK_questions" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for questions
    await queryRunner.query(`CREATE INDEX "IDX_questions_survey_order" ON "questions" ("survey_id", "order")`);

    // Create survey_responses table
    await queryRunner.query(`
      CREATE TABLE "survey_responses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "survey_id" uuid NOT NULL,
        "user_id" uuid,
        "uuid" uuid NOT NULL,
        "status" character varying NOT NULL DEFAULT 'draft',
        "submitted_at" TIMESTAMP WITH TIME ZONE,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_survey_responses_uuid" UNIQUE ("uuid"),
        CONSTRAINT "PK_survey_responses" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for survey_responses
    await queryRunner.query(`CREATE INDEX "IDX_survey_responses_survey_submitted" ON "survey_responses" ("survey_id", "submitted_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_survey_responses_uuid" ON "survey_responses" ("uuid")`);

    // Create answers table
    await queryRunner.query(`
      CREATE TABLE "answers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "response_id" uuid NOT NULL,
        "question_id" uuid NOT NULL,
        "answer" jsonb,
        "files" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_answers_response_question" UNIQUE ("response_id", "question_id"),
        CONSTRAINT "PK_answers" PRIMARY KEY ("id")
      )
    `);

    // Create index for answers
    await queryRunner.query(`CREATE INDEX "IDX_answers_response_question" ON "answers" ("response_id", "question_id")`);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "surveys" 
      ADD CONSTRAINT "FK_surveys_created_by" 
      FOREIGN KEY ("created_by") REFERENCES "users"("id") 
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "questions" 
      ADD CONSTRAINT "FK_questions_survey" 
      FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "questions" 
      ADD CONSTRAINT "FK_questions_parent" 
      FOREIGN KEY ("parent_question_id") REFERENCES "questions"("id") 
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "survey_responses" 
      ADD CONSTRAINT "FK_survey_responses_survey" 
      FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "survey_responses" 
      ADD CONSTRAINT "FK_survey_responses_user" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "answers" 
      ADD CONSTRAINT "FK_answers_response" 
      FOREIGN KEY ("response_id") REFERENCES "survey_responses"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "answers" 
      ADD CONSTRAINT "FK_answers_question" 
      FOREIGN KEY ("question_id") REFERENCES "questions"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "answers" DROP CONSTRAINT "FK_answers_question"`);
    await queryRunner.query(`ALTER TABLE "answers" DROP CONSTRAINT "FK_answers_response"`);
    await queryRunner.query(`ALTER TABLE "survey_responses" DROP CONSTRAINT "FK_survey_responses_user"`);
    await queryRunner.query(`ALTER TABLE "survey_responses" DROP CONSTRAINT "FK_survey_responses_survey"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_questions_parent"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_questions_survey"`);
    await queryRunner.query(`ALTER TABLE "surveys" DROP CONSTRAINT "FK_surveys_created_by"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_answers_response_question"`);
    await queryRunner.query(`DROP INDEX "IDX_survey_responses_uuid"`);
    await queryRunner.query(`DROP INDEX "IDX_survey_responses_survey_submitted"`);
    await queryRunner.query(`DROP INDEX "IDX_questions_survey_order"`);
    await queryRunner.query(`DROP INDEX "IDX_surveys_slug"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "answers"`);
    await queryRunner.query(`DROP TABLE "survey_responses"`);
    await queryRunner.query(`DROP TABLE "questions"`);
    await queryRunner.query(`DROP TABLE "surveys"`);
  }
}
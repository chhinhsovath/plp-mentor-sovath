import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissionsTables1700000000002 implements MigrationInterface {
  name = 'AddMissionsTables1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "mission_type_enum" AS ENUM ('field_trip', 'training', 'meeting', 'monitoring', 'other')
    `);

    await queryRunner.query(`
      CREATE TYPE "mission_status_enum" AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled')
    `);

    // Create missions table
    await queryRunner.query(`
      CREATE TABLE "missions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "description" text,
        "type" "mission_type_enum" NOT NULL DEFAULT 'other',
        "status" "mission_status_enum" NOT NULL DEFAULT 'draft',
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "location" character varying(500),
        "latitude" decimal(10,8),
        "longitude" decimal(11,8),
        "purpose" character varying(255),
        "objectives" text,
        "expected_outcomes" text,
        "budget" decimal(10,2),
        "transportation_details" text,
        "accommodation_details" text,
        "participants" json,
        "attachments" json,
        "created_by" uuid NOT NULL,
        "approved_by" uuid,
        "approved_at" TIMESTAMP,
        "approval_comments" text,
        "rejection_reason" text,
        "completion_report" text,
        "actual_start_time" TIMESTAMP,
        "actual_end_time" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_missions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_missions_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_missions_approved_by" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    // Create mission_participants table
    await queryRunner.query(`
      CREATE TABLE "mission_participants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mission_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" character varying(50) NOT NULL DEFAULT 'participant',
        "is_leader" boolean NOT NULL DEFAULT false,
        "has_confirmed" boolean NOT NULL DEFAULT false,
        "confirmed_at" TIMESTAMP,
        "has_checked_in" boolean NOT NULL DEFAULT false,
        "checked_in_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mission_participants_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_mission_participants_mission" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_mission_participants_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Create mission_tracking table
    await queryRunner.query(`
      CREATE TABLE "mission_tracking" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mission_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "latitude" decimal(10,8) NOT NULL,
        "longitude" decimal(11,8) NOT NULL,
        "accuracy" float,
        "recorded_at" TIMESTAMP NOT NULL,
        "activity" character varying(50) NOT NULL,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mission_tracking_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_mission_tracking_mission" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_mission_tracking_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_missions_status" ON "missions" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_missions_created_by" ON "missions" ("created_by")`);
    await queryRunner.query(`CREATE INDEX "IDX_missions_start_date" ON "missions" ("start_date")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_mission_participants_mission_user" ON "mission_participants" ("mission_id", "user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_mission_tracking_mission" ON "mission_tracking" ("mission_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_mission_tracking_recorded_at" ON "mission_tracking" ("recorded_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_mission_tracking_recorded_at"`);
    await queryRunner.query(`DROP INDEX "IDX_mission_tracking_mission"`);
    await queryRunner.query(`DROP INDEX "IDX_mission_participants_mission_user"`);
    await queryRunner.query(`DROP INDEX "IDX_missions_start_date"`);
    await queryRunner.query(`DROP INDEX "IDX_missions_created_by"`);
    await queryRunner.query(`DROP INDEX "IDX_missions_status"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "mission_tracking"`);
    await queryRunner.query(`DROP TABLE "mission_participants"`);
    await queryRunner.query(`DROP TABLE "missions"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "mission_status_enum"`);
    await queryRunner.query(`DROP TYPE "mission_type_enum"`);
  }
}
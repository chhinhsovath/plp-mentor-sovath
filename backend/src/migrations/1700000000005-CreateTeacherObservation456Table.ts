import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTeacherObservation456Table1700000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'teacher_observations_456',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'school_name',
            type: 'varchar',
          },
          {
            name: 'school_code',
            type: 'varchar',
          },
          {
            name: 'commune',
            type: 'varchar',
          },
          {
            name: 'district',
            type: 'varchar',
          },
          {
            name: 'province',
            type: 'varchar',
          },
          {
            name: 'observer_name',
            type: 'varchar',
          },
          {
            name: 'observer_code',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'observation_date',
            type: 'date',
          },
          {
            name: 'grade',
            type: 'varchar',
          },
          {
            name: 'subject',
            type: 'varchar',
          },
          {
            name: 'teacher_name',
            type: 'varchar',
          },
          {
            name: 'teacher_code',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'start_time',
            type: 'time',
          },
          {
            name: 'end_time',
            type: 'time',
          },
          {
            name: 'introduction_scores',
            type: 'jsonb',
          },
          {
            name: 'teaching_scores',
            type: 'jsonb',
          },
          {
            name: 'learning_scores',
            type: 'jsonb',
          },
          {
            name: 'assessment_scores',
            type: 'jsonb',
          },
          {
            name: 'student_counts',
            type: 'jsonb',
          },
          {
            name: 'comments',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'observer_signature',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'teacher_signature',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'total_introduction_score',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_teaching_score',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_learning_score',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_assessment_score',
            type: 'int',
            default: 0,
          },
          {
            name: 'overall_score',
            type: 'int',
            default: 0,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'submitted'",
          },
          {
            name: 'observer_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            name: 'FK_teacher_observation_456_observer',
            columnNames: ['observer_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
        indices: [
          {
            name: 'IDX_teacher_observation_456_observer_id',
            columnNames: ['observer_id'],
          },
          {
            name: 'IDX_teacher_observation_456_school_code',
            columnNames: ['school_code'],
          },
          {
            name: 'IDX_teacher_observation_456_observation_date',
            columnNames: ['observation_date'],
          },
          {
            name: 'IDX_teacher_observation_456_grade',
            columnNames: ['grade'],
          },
          {
            name: 'IDX_teacher_observation_456_subject',
            columnNames: ['subject'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('teacher_observations_456');
  }
}
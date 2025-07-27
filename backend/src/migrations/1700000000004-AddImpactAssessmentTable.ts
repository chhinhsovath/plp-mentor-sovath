import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImpactAssessmentTable1700000000004 implements MigrationInterface {
  name = 'AddImpactAssessmentTable1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create impact_assessments table
    await queryRunner.query(`
      CREATE TABLE \`impact_assessments\` (
        \`id\` varchar(36) NOT NULL,
        \`schoolName\` varchar(255) NOT NULL,
        \`schoolType\` enum('primary', 'lower-secondary', 'upper-secondary', 'high-school', 'technical', 'university', 'pagoda') NOT NULL,
        \`province\` enum('banteay-meanchey', 'battambang', 'pailin', 'oddar-meanchey', 'preah-vihear', 'stung-treng', 'ratanakiri', 'mondulkiri') NOT NULL,
        \`district\` varchar(100) NOT NULL,
        \`commune\` varchar(100) NOT NULL,
        \`village\` varchar(100) NOT NULL,
        \`gradeData\` json NOT NULL,
        \`totals\` json NOT NULL,
        \`impactTypes\` text NOT NULL,
        \`severity\` int NOT NULL,
        \`incidentDate\` date NOT NULL,
        \`duration\` int NULL,
        \`teacherAffected\` int NOT NULL DEFAULT '0',
        \`contactInfo\` varchar(255) NULL,
        \`description\` text NULL,
        \`submittedBy\` varchar(100) NOT NULL DEFAULT 'Anonymous',
        \`submittedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`status\` enum('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
        \`verifiedBy\` varchar(36) NULL,
        \`verifiedAt\` timestamp NULL,
        \`verificationNotes\` text NULL,
        \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Add indexes
    await queryRunner.query(`CREATE INDEX \`IDX_impact_province_date\` ON \`impact_assessments\` (\`province\`, \`incidentDate\`)`);
    await queryRunner.query(`CREATE INDEX \`IDX_impact_severity\` ON \`impact_assessments\` (\`severity\`)`);
    await queryRunner.query(`CREATE INDEX \`IDX_impact_schoolType\` ON \`impact_assessments\` (\`schoolType\`)`);
    await queryRunner.query(`CREATE INDEX \`IDX_impact_status\` ON \`impact_assessments\` (\`status\`)`);
    await queryRunner.query(`CREATE INDEX \`IDX_impact_submittedAt\` ON \`impact_assessments\` (\`submittedAt\`)`);

    // Add foreign key for verifiedBy
    await queryRunner.query(`ALTER TABLE \`impact_assessments\` ADD CONSTRAINT \`FK_impact_verifiedBy\` FOREIGN KEY (\`verifiedBy\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.query(`ALTER TABLE \`impact_assessments\` DROP FOREIGN KEY \`FK_impact_verifiedBy\``);

    // Drop indexes
    await queryRunner.query(`DROP INDEX \`IDX_impact_submittedAt\` ON \`impact_assessments\``);
    await queryRunner.query(`DROP INDEX \`IDX_impact_status\` ON \`impact_assessments\``);
    await queryRunner.query(`DROP INDEX \`IDX_impact_schoolType\` ON \`impact_assessments\``);
    await queryRunner.query(`DROP INDEX \`IDX_impact_severity\` ON \`impact_assessments\``);
    await queryRunner.query(`DROP INDEX \`IDX_impact_province_date\` ON \`impact_assessments\``);

    // Drop table
    await queryRunner.query(`DROP TABLE \`impact_assessments\``);
  }
}
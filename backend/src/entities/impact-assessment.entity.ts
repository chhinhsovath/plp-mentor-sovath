import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { User } from './user.entity';

@Entity('impact_assessments')
@Index(['province', 'incidentDate'])
@Index(['severity'])
@Index(['schoolType'])
@Index(['status'])
@Index(['submittedAt'])
export class ImpactAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // School Information
  @Column({ type: 'varchar', length: 255 })
  schoolName: string;

  @Column({
    type: 'enum',
    enum: ['primary', 'lower-secondary', 'upper-secondary', 'high-school', 'technical', 'university', 'pagoda']
  })
  schoolType: string;

  // Location Information
  @Column({
    type: 'enum',
    enum: ['banteay-meanchey', 'battambang', 'pailin', 'oddar-meanchey', 'preah-vihear', 'stung-treng', 'ratanakiri', 'mondulkiri']
  })
  province: string;

  @Column({ type: 'varchar', length: 100 })
  district: string;

  @Column({ type: 'varchar', length: 100 })
  commune: string;

  @Column({ type: 'varchar', length: 100 })
  village: string;

  // Student Impact Data
  @Column({ type: 'json' })
  gradeData: {
    grade: string;
    totalStudents: number;
    affectedStudents: number;
  }[];

  @Column({ type: 'json' })
  totals: {
    totalStudents: number;
    totalAffected: number;
    percentage: number;
  };

  // Impact Details
  @Column({
    type: 'simple-array'
  })
  impactTypes: string[];

  @Column({ type: 'int', width: 1 })
  severity: number;

  @Column({ type: 'date' })
  incidentDate: Date;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @Column({ type: 'int', default: 0 })
  teacherAffected: number;

  // Additional Information
  @Column({ type: 'varchar', length: 255, nullable: true })
  contactInfo: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Submission Metadata
  @Column({ type: 'varchar', length: 100, default: 'Anonymous' })
  submittedBy: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt: Date;

  // Status for workflow
  @Column({
    type: 'enum',
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  })
  status: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifiedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'text', nullable: true })
  verificationNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual field for reference ID
  get referenceId(): string {
    if (!this.createdAt || !this.id) return '';
    const year = this.createdAt.getFullYear();
    const idSuffix = this.id.slice(-6).toUpperCase();
    return `IA-${year}-${idSuffix}`;
  }

  // Validation before save
  @BeforeInsert()
  @BeforeUpdate()
  validateData() {
    // Validate that affected students don't exceed total students
    if (this.gradeData && this.gradeData.length > 0) {
      for (const grade of this.gradeData) {
        if (grade.affectedStudents > grade.totalStudents) {
          throw new Error(
            `Affected students (${grade.affectedStudents}) cannot exceed total students (${grade.totalStudents}) for grade ${grade.grade}`
          );
        }
      }
    }

    // Recalculate totals
    if (this.gradeData && this.gradeData.length > 0) {
      const totalStudents = this.gradeData.reduce((sum, grade) => sum + grade.totalStudents, 0);
      const totalAffected = this.gradeData.reduce((sum, grade) => sum + grade.affectedStudents, 0);
      const percentage = totalStudents > 0 ? Math.round((totalAffected / totalStudents) * 100) : 0;

      this.totals = {
        totalStudents,
        totalAffected,
        percentage
      };
    }

    // Validate severity range
    if (this.severity < 1 || this.severity > 5) {
      throw new Error('Severity must be between 1 and 5');
    }
  }
}
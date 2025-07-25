import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { LessonPhase } from './lesson-phase.entity';
import { CompetencyDomain } from './competency-domain.entity';
import { ObservationSession } from './observation-session.entity';

@Entity('observation_forms')
export class ObservationForm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'form_code', unique: true })
  formCode: string;

  @Column()
  title: string;

  @Column()
  subject: string;

  @Column({ name: 'grade_range' })
  gradeRange: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => LessonPhase, (phase) => phase.form)
  lessonPhases: LessonPhase[];

  @OneToMany(() => CompetencyDomain, (domain) => domain.form)
  competencyDomains: CompetencyDomain[];

  @OneToMany(() => ObservationSession, (session) => session.form)
  observationSessions: ObservationSession[];
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { LessonPhase } from './lesson-phase.entity';
import { CompetencyDomain } from './competency-domain.entity';
import { IndicatorScale } from './indicator-scale.entity';
import { IndicatorResponse } from './indicator-response.entity';

export enum RubricType {
  SCALE = 'scale',
  CHECKBOX = 'checkbox',
}

@Entity('indicators')
export class Indicator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'phase_id', nullable: true })
  phaseId: string;

  @Column({ name: 'domain_id', nullable: true })
  domainId: string;

  @Column({ name: 'indicator_number' })
  indicatorNumber: string;

  @Column({ name: 'indicator_text' })
  indicatorText: string;

  @Column({ name: 'max_score' })
  maxScore: number;

  @Column({
    name: 'rubric_type',
    type: 'enum',
    enum: RubricType,
    default: RubricType.SCALE,
  })
  rubricType: RubricType;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => LessonPhase, (phase) => phase.indicators)
  @JoinColumn({ name: 'phase_id' })
  phase: LessonPhase;

  @ManyToOne(() => CompetencyDomain, (domain) => domain.indicators)
  @JoinColumn({ name: 'domain_id' })
  domain: CompetencyDomain;

  @OneToMany(() => IndicatorScale, (scale) => scale.indicator)
  scales: IndicatorScale[];

  @OneToMany(() => IndicatorResponse, (response) => response.indicator)
  responses: IndicatorResponse[];
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ObservationSession } from './observation-session.entity';
import { Indicator } from './indicator.entity';

@Entity('indicator_responses')
export class IndicatorResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'indicator_id' })
  indicatorId: string;

  @Column({ name: 'selected_score', nullable: true })
  selectedScore: number;

  @Column({ name: 'selected_level', nullable: true })
  selectedLevel: string;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => ObservationSession, (session) => session.indicatorResponses)
  @JoinColumn({ name: 'session_id' })
  session: ObservationSession;

  @ManyToOne(() => Indicator, (indicator) => indicator.responses)
  @JoinColumn({ name: 'indicator_id' })
  indicator: Indicator;
}

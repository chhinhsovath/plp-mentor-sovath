import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ImprovementPlan } from './improvement-plan.entity';

@Entity('improvement_actions')
export class ImprovementAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @Column({ name: 'action_description' })
  actionDescription: string;

  @Column({ name: 'responsible_person' })
  responsiblePerson: string;

  @Column({ type: 'date' })
  deadline: Date;

  @ManyToOne(() => ImprovementPlan, (plan) => plan.actions)
  @JoinColumn({ name: 'plan_id' })
  plan: ImprovementPlan;
}

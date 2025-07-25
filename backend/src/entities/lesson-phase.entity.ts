import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ObservationForm } from './observation-form.entity';
import { Indicator } from './indicator.entity';

@Entity('lesson_phases')
export class LessonPhase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'form_id' })
  formId: string;

  @Column()
  title: string;

  @Column({ name: 'section_order' })
  sectionOrder: number;

  @ManyToOne(() => ObservationForm, (form) => form.lessonPhases)
  @JoinColumn({ name: 'form_id' })
  form: ObservationForm;

  @OneToMany(() => Indicator, (indicator) => indicator.phase)
  indicators: Indicator[];
}

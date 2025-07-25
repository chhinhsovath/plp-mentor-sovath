import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ObservationForm } from './observation-form.entity';
import { Indicator } from './indicator.entity';

@Entity('competency_domains')
export class CompetencyDomain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'form_id' })
  formId: string;

  @Column()
  subject: string;

  @Column({ name: 'domain_name' })
  domainName: string;

  @ManyToOne(() => ObservationForm, (form) => form.competencyDomains)
  @JoinColumn({ name: 'form_id' })
  form: ObservationForm;

  @OneToMany(() => Indicator, (indicator) => indicator.domain)
  indicators: Indicator[];
}

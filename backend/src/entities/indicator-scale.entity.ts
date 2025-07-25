import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Indicator } from './indicator.entity';

@Entity('indicator_scales')
export class IndicatorScale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'indicator_id' })
  indicatorId: string;

  @Column({ name: 'scale_label' })
  scaleLabel: string;

  @Column({ name: 'scale_description' })
  scaleDescription: string;

  @ManyToOne(() => Indicator, (indicator) => indicator.scales)
  @JoinColumn({ name: 'indicator_id' })
  indicator: Indicator;
}

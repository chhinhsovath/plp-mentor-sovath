import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('role_hierarchy_access')
export class RoleHierarchyAccess {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  role: string;

  @Column({ name: 'can_view' })
  canView: string;

  @Column('text', { array: true })
  manages: string[];

  @Column({ name: 'can_approve_missions' })
  canApproveMissions: boolean;

  @Column({ nullable: true })
  notes: string;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_LOGIN = 'FAILED_LOGIN',
  EXPORT = 'EXPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export enum AuditEntityType {
  USER = 'USER',
  OBSERVATION_SESSION = 'OBSERVATION_SESSION',
  OBSERVATION_FORM = 'OBSERVATION_FORM',
  IMPROVEMENT_PLAN = 'IMPROVEMENT_PLAN',
  SIGNATURE = 'SIGNATURE',
  ROLE = 'ROLE',
  SYSTEM = 'SYSTEM',
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['entityType', 'entityId'])
@Index(['action', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId: string;

  @Column({ name: 'user_email', nullable: true })
  userEmail: string;

  @Column({ name: 'user_role', nullable: true })
  userRole: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditEntityType,
  })
  @Index()
  entityType: AuditEntityType;

  @Column({ name: 'entity_id', nullable: true })
  @Index()
  entityId: string;

  @Column({ name: 'entity_name', nullable: true })
  entityName: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'request_id', nullable: true })
  requestId: string;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'risk_level', default: 'LOW' })
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @Column({ name: 'success', default: true })
  success: boolean;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;
}
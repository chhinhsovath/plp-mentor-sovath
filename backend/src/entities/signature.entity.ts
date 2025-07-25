import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ObservationSession } from './observation-session.entity';

export enum SignerRole {
  OBSERVER = 'observer',
  TEACHER = 'teacher',
}

@Entity('signatures')
export class Signature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({
    type: 'enum',
    enum: SignerRole,
  })
  role: SignerRole;

  @Column({ name: 'signer_name' })
  signerName: string;

  @Column({ name: 'signature_data', type: 'text', nullable: true })
  signatureData: string;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'is_valid', default: true })
  isValid: boolean;

  // Keep legacy field for backward compatibility
  @Column({ name: 'signed_date', type: 'date' })
  signedDate: Date;

  @ManyToOne(() => ObservationSession, (session) => session.signatures)
  @JoinColumn({ name: 'session_id' })
  session: ObservationSession;
}

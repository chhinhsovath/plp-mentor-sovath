import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ObservationSession } from './observation-session.entity';

export enum UserRole {
  ADMINISTRATOR = 'Administrator',
  ZONE = 'Zone',
  PROVINCIAL = 'Provincial',
  DEPARTMENT = 'Department',
  CLUSTER = 'Cluster',
  DIRECTOR = 'Director',
  TEACHER = 'Teacher',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TEACHER,
  })
  role: UserRole;

  @Column({ name: 'location_scope', nullable: true })
  locationScope: string;

  @Column({ name: 'zone_id', nullable: true })
  zoneId: string;

  @Column({ name: 'province_id', nullable: true })
  provinceId: string;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @Column({ name: 'cluster_id', nullable: true })
  clusterId: string;

  @Column({ name: 'school_id', nullable: true })
  schoolId: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column({ name: 'profile_picture', nullable: true })
  profilePicture: string;

  @Column({ name: 'preferred_language', nullable: true, default: 'en' })
  preferredLanguage: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'office_location', nullable: true })
  officeLocation: string;

  @Column({ name: 'office_latitude', type: 'float', nullable: true })
  officeLatitude: number;

  @Column({ name: 'office_longitude', type: 'float', nullable: true })
  officeLongitude: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login', nullable: true })
  lastLogin: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ObservationSession, (session) => session.observer)
  observationSessions: ObservationSession[];
}

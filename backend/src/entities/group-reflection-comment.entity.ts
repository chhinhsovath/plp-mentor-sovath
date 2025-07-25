import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ObservationSession } from './observation-session.entity';

@Entity('group_reflection_comments')
export class GroupReflectionComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'comment_type' })
  commentType: string;

  @Column({ name: 'comment_content' })
  commentContent: string;

  @ManyToOne(() => ObservationSession, (session) => session.reflectionComments)
  @JoinColumn({ name: 'session_id' })
  session: ObservationSession;
}

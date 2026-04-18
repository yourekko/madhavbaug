import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'actor_user_id', type: 'varchar', nullable: true, length: 120 })
  actorUserId!: string | null;

  @ManyToOne(() => User, (user) => user.auditLogs, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser?: User | null;

  @Column({ length: 120 })
  action!: string;

  @Column({ name: 'entity_type', length: 80 })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'varchar', nullable: true, length: 120 })
  entityId!: string | null;

  @Column({ name: 'payload_json', type: 'simple-json', nullable: true })
  payloadJson!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

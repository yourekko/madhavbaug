import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { Answer } from './answer.entity';
import { AuditLog } from './audit-log.entity';
import { DoctorProfile } from './doctor-profile.entity';
import { Question } from './question.entity';
import { QuestionAssignment } from './question-assignment.entity';
import { QuestionFollowup } from './question-followup.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: Role, default: Role.PATIENT })
  role!: Role;

  @Column({ length: 120 })
  name!: string;

  @Column({ type: 'varchar', unique: true, nullable: true, length: 180 })
  email!: string | null;

  @Column({ type: 'varchar', unique: true, nullable: true, length: 20 })
  phone!: string | null;

  @Column({ name: 'google_sub', type: 'varchar', unique: true, nullable: true, length: 255 })
  googleSub!: string | null;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => DoctorProfile, (profile) => profile.user)
  doctorProfile?: DoctorProfile;

  @OneToMany(() => Question, (question) => question.patientUser)
  patientQuestions?: Question[];

  @OneToMany(() => QuestionAssignment, (assignment) => assignment.doctor)
  assignments?: QuestionAssignment[];

  @OneToMany(() => Answer, (answer) => answer.doctor)
  answers?: Answer[];

  @OneToMany(() => QuestionFollowup, (followup) => followup.patientUser)
  followups?: QuestionFollowup[];

  @OneToMany(() => AuditLog, (log) => log.actorUser)
  auditLogs?: AuditLog[];
}

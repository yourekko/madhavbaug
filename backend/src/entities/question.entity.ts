import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QuestionStatus } from '../common/enums/question-status.enum';
import { Answer } from './answer.entity';
import { QuestionAssignment } from './question-assignment.entity';
import { QuestionFollowup } from './question-followup.entity';
import { User } from './user.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_user_id' })
  patientUserId!: string;

  @ManyToOne(() => User, (user) => user.patientQuestions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_user_id' })
  patientUser!: User;

  @Column({ length: 180 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ length: 80 })
  category!: string;

  /** SEO-friendly path segment under /forum/:category/questions/:slug */
  @Column({ name: 'forum_slug', type: 'varchar', length: 200, unique: true, nullable: true })
  forumSlug!: string | null;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount!: number;

  @Column({ type: 'enum', enum: QuestionStatus, default: QuestionStatus.OPEN })
  status!: QuestionStatus;

  @OneToMany(() => QuestionAssignment, (assignment) => assignment.question)
  assignments?: QuestionAssignment[];

  @OneToMany(() => Answer, (answer) => answer.question)
  answers?: Answer[];

  @OneToMany(() => QuestionFollowup, (followup) => followup.question)
  followups?: QuestionFollowup[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

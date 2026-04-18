import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Question } from './question.entity';
import { User } from './user.entity';

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'question_id' })
  questionId!: string;

  @ManyToOne(() => Question, (question) => question.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column({ name: 'doctor_user_id' })
  doctorUserId!: string;

  @ManyToOne(() => User, (user) => user.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_user_id' })
  doctor!: User;

  @Column({ name: 'answer_text', type: 'text' })
  answerText!: string;

  @Column({ name: 'is_published', default: true })
  isPublished!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

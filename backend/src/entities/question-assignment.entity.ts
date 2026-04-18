import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Question } from './question.entity';
import { User } from './user.entity';

@Entity('question_assignments')
export class QuestionAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'question_id' })
  questionId!: string;

  @ManyToOne(() => Question, (question) => question.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column({ name: 'doctor_user_id' })
  doctorUserId!: string;

  @ManyToOne(() => User, (user) => user.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_user_id' })
  doctor!: User;

  @Column({ name: 'assigned_by', type: 'varchar', length: 120, nullable: true })
  assignedBy!: string | null;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt!: Date;
}

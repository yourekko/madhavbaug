import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Question } from './question.entity';
import { User } from './user.entity';

@Entity('question_followups')
export class QuestionFollowup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'question_id' })
  questionId!: string;

  @ManyToOne(() => Question, (question) => question.followups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column({ name: 'patient_user_id' })
  patientUserId!: string;

  @ManyToOne(() => User, (user) => user.followups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_user_id' })
  patientUser!: User;

  @Column({ type: 'text' })
  message!: string;

  @Column({ name: 'optional_contact_name', type: 'varchar', nullable: true, length: 120 })
  optionalContactName!: string | null;

  @Column({ name: 'optional_contact_phone', type: 'varchar', nullable: true, length: 20 })
  optionalContactPhone!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

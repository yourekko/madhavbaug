import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('doctor_profiles')
export class DoctorProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', unique: true })
  userId!: string;

  @OneToOne(() => User, (user) => user.doctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ length: 100 })
  degree!: string;

  @Column({ length: 180 })
  qualification!: string;

  @Column({ name: 'clinical_experience_years', type: 'int', default: 0 })
  clinicalExperienceYears!: number;

  @Column({ type: 'text' })
  bio!: string;

  @Column({ name: 'photo_url', type: 'varchar', nullable: true, length: 500 })
  photoUrl!: string | null;

  @Column({ name: 'expertise_tags', type: 'simple-json', nullable: true })
  expertiseTags!: string[] | null;
}

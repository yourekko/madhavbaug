import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Answer } from './entities/answer.entity';
import { AuditLog } from './entities/audit-log.entity';
import { DoctorProfile } from './entities/doctor-profile.entity';
import { QuestionAssignment } from './entities/question-assignment.entity';
import { QuestionFollowup } from './entities/question-followup.entity';
import { ForumQuestionViewDedupe } from './entities/forum-question-view-dedupe.entity';
import { Question } from './entities/question.entity';
import { SeoPage } from './entities/seo-page.entity';
import { User } from './entities/user.entity';

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'madhavbaug',
  entities: [
    User,
    DoctorProfile,
    Question,
    QuestionAssignment,
    Answer,
    QuestionFollowup,
    SeoPage,
    AuditLog,
    ForumQuestionViewDedupe,
  ],
  migrations: ['dist/migrations/*.js'],
});

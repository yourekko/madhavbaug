import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Answer } from '../entities/answer.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { QuestionAssignment } from '../entities/question-assignment.entity';
import { QuestionFollowup } from '../entities/question-followup.entity';
import { Question } from '../entities/question.entity';
import { User } from '../entities/user.entity';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { DoctorController } from './doctor.controller';
import { ForumPublicController } from './forum-public.controller';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Question, QuestionFollowup, Answer, QuestionAssignment, User, AuditLog]), UsersModule],
  controllers: [QuestionsController, DoctorController, AdminController, ForumPublicController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}

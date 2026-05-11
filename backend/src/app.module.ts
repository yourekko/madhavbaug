import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Answer } from './entities/answer.entity';
import { AuditLog } from './entities/audit-log.entity';
import { DoctorProfile } from './entities/doctor-profile.entity';
import { ForumQuestionViewDedupe } from './entities/forum-question-view-dedupe.entity';
import { QuestionAssignment } from './entities/question-assignment.entity';
import { QuestionFollowup } from './entities/question-followup.entity';
import { Question } from './entities/question.entity';
import { SeoPage } from './entities/seo-page.entity';
import { User } from './entities/user.entity';
import { QuestionsModule } from './questions/questions.module';
import { SeedService } from './seed/seed.service';
import { SeoModule } from './seo/seo.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: Number(config.get<string>('DB_PORT', '3306')),
        username: config.get<string>('DB_USER', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'madhavbaug'),
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
        synchronize: config.get<string>('DB_SYNC', 'true') === 'true',
      }),
    }),
    UsersModule,
    AuthModule,
    QuestionsModule,
    SeoModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}

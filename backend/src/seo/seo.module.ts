import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Answer } from '../entities/answer.entity';
import { Question } from '../entities/question.entity';
import { SeoPage } from '../entities/seo-page.entity';
import { PublicSeoController } from './public-seo.controller';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';

@Module({
  imports: [TypeOrmModule.forFeature([SeoPage, Question, Answer])],
  controllers: [SeoController, PublicSeoController],
  providers: [SeoService],
  exports: [SeoService],
})
export class SeoModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeoPage } from '../entities/seo-page.entity';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';

@Module({
  imports: [TypeOrmModule.forFeature([SeoPage])],
  controllers: [SeoController],
  providers: [SeoService],
})
export class SeoModule {}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeoPage } from '../entities/seo-page.entity';
import { UpsertSeoPageDto } from './dto/upsert-seo-page.dto';

@Injectable()
export class SeoService {
  constructor(
    @InjectRepository(SeoPage)
    private readonly seoRepo: Repository<SeoPage>,
  ) {}

  async getBySlug(slug: string) {
    return this.seoRepo.findOne({ where: { slug } });
  }

  async upsertBySlug(slug: string, dto: UpsertSeoPageDto, adminUserId: string) {
    const existing = await this.seoRepo.findOne({ where: { slug } });
    const record = this.seoRepo.create({
      id: existing?.id,
      slug,
      pageType: dto.pageType ?? existing?.pageType ?? 'generic',
      title: dto.title ?? existing?.title ?? slug,
      metaDescription: dto.metaDescription ?? existing?.metaDescription ?? null,
      canonicalUrl: dto.canonicalUrl ?? existing?.canonicalUrl ?? null,
      robots: dto.robots ?? existing?.robots ?? 'index,follow',
      ogTitle: dto.ogTitle ?? existing?.ogTitle ?? null,
      ogDescription: dto.ogDescription ?? existing?.ogDescription ?? null,
      updatedBy: adminUserId,
    });
    return this.seoRepo.save(record);
  }
}

import { Repository } from 'typeorm';
import { SeoPage } from '../entities/seo-page.entity';
import { UpsertSeoPageDto } from './dto/upsert-seo-page.dto';
export declare class SeoService {
    private readonly seoRepo;
    constructor(seoRepo: Repository<SeoPage>);
    getBySlug(slug: string): Promise<SeoPage | null>;
    upsertBySlug(slug: string, dto: UpsertSeoPageDto, adminUserId: string): Promise<SeoPage>;
}

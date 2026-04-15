import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { UpsertSeoPageDto } from './dto/upsert-seo-page.dto';
import { SeoService } from './seo.service';
export declare class SeoController {
    private readonly seoService;
    constructor(seoService: SeoService);
    getBySlug(slug: string): Promise<import("../entities/seo-page.entity").SeoPage | null>;
    upsert(slug: string, dto: UpsertSeoPageDto, user: JwtPayload): Promise<import("../entities/seo-page.entity").SeoPage>;
}

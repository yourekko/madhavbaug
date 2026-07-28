import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { UpsertQuestionSeoDto } from './dto/upsert-question-seo.dto';
import { UpsertSeoPageDto } from './dto/upsert-seo-page.dto';
import { SeoService } from './seo.service';
export declare class SeoController {
    private readonly seoService;
    constructor(seoService: SeoService);
    listHubs(): Promise<{
        slug: string;
        pageType: string;
        label: string;
        publicPath: string;
        publicUrl: string;
        isCustom: boolean;
        title: string;
        metaDescription: string;
        robots: string;
        focusKeyword: string;
        keywords: string;
        ogTitle: string | null;
        ogDescription: string | null;
        canonicalUrl: string;
        updatedAt: Date | null;
        defaults: {
            title: string;
            metaDescription: string;
            focusKeyword: string;
            keywords: string;
        };
    }[]>;
    listQuestionSeo(): Promise<{
        questionId: string;
        forumSlug: string | null;
        category: string;
        categorySlug: string | null;
        questionPreview: string;
        answerCount: number;
        doctorName: string | null;
        publicPath: string | null;
        publicUrl: string | null;
        inSitemap: boolean;
        autoTitle: string;
        autoDescription: string;
        seo: {
            title: string;
            metaDescription: string;
            robots: string;
            focusKeyword: string | null;
            keywords: string | null;
            ogTitle: string | null;
            ogDescription: string | null;
            canonicalUrl: string | null;
            internalLinks: string[];
            updatedAt: Date | null;
            isCustom: boolean;
        };
    }[]>;
    upsertQuestionSeo(questionId: string, dto: UpsertQuestionSeoDto, user: JwtPayload): Promise<{
        questionId: string;
        seo: {
            title: string;
            metaDescription: string | null;
            robots: string;
            focusKeyword: string | null;
            keywords: string | null;
            ogTitle: string | null;
            ogDescription: string | null;
            internalLinks: string[];
            canonicalUrl: string | null;
            isCustom: boolean;
            updatedAt: Date;
        };
    }>;
    getBySlug(slug: string): Promise<{
        slug: string;
        pageType: string;
        label: string;
        publicPath: string;
        publicUrl: string;
        isCustom: boolean;
        title: string;
        metaDescription: string;
        robots: string;
        focusKeyword: string;
        keywords: string;
        ogTitle: string | null;
        ogDescription: string | null;
        canonicalUrl: string;
        updatedAt: Date | null;
        defaults: {
            title: string;
            metaDescription: string;
            focusKeyword: string;
            keywords: string;
        };
    } | {
        slug: string;
        pageType: string;
        label: string;
        publicPath: null;
        publicUrl: string | null;
        isCustom: boolean;
        title: string;
        metaDescription: string | null;
        robots: string;
        focusKeyword: string | null;
        keywords: string | null;
        ogTitle: string | null;
        ogDescription: string | null;
        canonicalUrl: string | null;
        updatedAt: Date;
    }>;
    upsert(slug: string, dto: UpsertSeoPageDto, user: JwtPayload): Promise<import("../entities/seo-page.entity").SeoPage>;
}

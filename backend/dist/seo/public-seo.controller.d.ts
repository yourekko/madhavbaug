import { SeoService } from './seo.service';
export declare class PublicSeoController {
    private readonly seoService;
    constructor(seoService: SeoService);
    getPage(slug: string): Promise<{
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
}

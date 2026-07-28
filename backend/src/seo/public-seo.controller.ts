import { Controller, Get, Param } from '@nestjs/common';
import { SeoService } from './seo.service';

/** Public SEO overrides for hub pages (home, ask, categories). */
@Controller('public/seo')
export class PublicSeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) {
    return this.seoService.getPublicPageSeo(slug);
  }
}

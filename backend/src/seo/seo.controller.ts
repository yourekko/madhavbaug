import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpsertQuestionSeoDto } from './dto/upsert-question-seo.dto';
import { UpsertSeoPageDto } from './dto/upsert-seo-page.dto';
import { SeoService } from './seo.service';

@Controller('admin/seo')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  /** Homepage, Ask, and category hub pages. */
  @Get('hubs')
  listHubs() {
    return this.seoService.listHubPages();
  }

  /** Answered Q&A pages — edit SEO for each published doctor answer thread. */
  @Get('questions')
  listQuestionSeo() {
    return this.seoService.listAnsweredQuestionSeo();
  }

  @Put('questions/:questionId')
  upsertQuestionSeo(
    @Param('questionId') questionId: string,
    @Body() dto: UpsertQuestionSeoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.seoService.upsertQuestionSeo(questionId, dto, user.sub);
  }

  @Get('pages/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.seoService.getPublicPageSeo(slug);
  }

  @Put('pages/:slug')
  upsert(@Param('slug') slug: string, @Body() dto: UpsertSeoPageDto, @CurrentUser() user: JwtPayload) {
    return this.seoService.upsertBySlug(slug, dto, user.sub);
  }
}

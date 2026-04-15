import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpsertSeoPageDto } from './dto/upsert-seo-page.dto';
import { SeoService } from './seo.service';

@Controller('admin/seo/pages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.seoService.getBySlug(slug);
  }

  @Put(':slug')
  upsert(@Param('slug') slug: string, @Body() dto: UpsertSeoPageDto, @CurrentUser() user: JwtPayload) {
    return this.seoService.upsertBySlug(slug, dto, user.sub);
  }
}

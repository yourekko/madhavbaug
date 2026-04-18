import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ForumReportDto } from './dto/forum-report.dto';
import { isValidForumCategorySlug } from './forum-category-map';
import { QuestionsService } from './questions.service';

@Controller('public/forum')
export class ForumPublicController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('stats')
  stats() {
    return this.questionsService.getPublicForumStats();
  }

  @Get('home-feed')
  homeFeed() {
    return this.questionsService.getPublicHomeFeed();
  }

  @Get(':categorySlug/questions')
  list(
    @Param('categorySlug') categorySlug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filter') filter?: string,
    @Query('sort') sort?: string,
  ) {
    if (!isValidForumCategorySlug(categorySlug)) throw new NotFoundException();
    const f = filter === 'open' ? 'open' : 'answered';
    const sortBy = sort === 'views' ? 'views' : 'latest';
    return this.questionsService.listPublicForumQuestions(
      categorySlug,
      Number(page ?? 1),
      Number(limit ?? 10),
      search,
      f,
      sortBy,
    );
  }

  @Get(':categorySlug/questions/:questionSlug')
  detail(@Param('categorySlug') categorySlug: string, @Param('questionSlug') questionSlug: string) {
    if (!isValidForumCategorySlug(categorySlug)) throw new NotFoundException();
    return this.questionsService.getPublicForumQuestionDetail(categorySlug, questionSlug);
  }

  @Post(':categorySlug/questions/:questionSlug/report')
  report(
    @Param('categorySlug') categorySlug: string,
    @Param('questionSlug') questionSlug: string,
    @Body() dto: ForumReportDto,
  ) {
    if (!isValidForumCategorySlug(categorySlug)) throw new NotFoundException();
    return this.questionsService.submitPublicForumReport(categorySlug, questionSlug, dto.message);
  }
}

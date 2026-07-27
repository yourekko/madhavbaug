import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { extractQuestionTitle } from '../common/utils/slugify';
import { Answer } from '../entities/answer.entity';
import { Question } from '../entities/question.entity';
import { SeoPage } from '../entities/seo-page.entity';
import { FORUM_SLUG_TO_CATEGORIES } from '../questions/forum-category-map';
import { UpsertQuestionSeoDto } from './dto/upsert-question-seo.dto';
import { UpsertSeoPageDto } from './dto/upsert-seo-page.dto';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function seoSlugForQuestion(questionId: string): string {
  return `qa-${questionId}`;
}

function forumSlugForCategory(category: string): string | null {
  const normalized = category.trim().toLowerCase();
  for (const [slug, categories] of Object.entries(FORUM_SLUG_TO_CATEGORIES)) {
    if (categories.some((cat) => cat.trim().toLowerCase() === normalized)) return slug;
  }
  return null;
}

function autoSeoTitle(category: string, body: string): string {
  return `${category}: ${extractQuestionTitle(body, 58)}`;
}

function autoSeoDescription(body: string, answerHtml: string | null, doctorName: string | null): string {
  const lead = extractQuestionTitle(body, 70);
  const answerPlain = answerHtml ? stripHtml(answerHtml) : '';
  const answerBit = answerPlain
    ? ` Doctor answer: ${answerPlain.slice(0, 70).trim()}${answerPlain.length > 70 ? '…' : ''}`
    : ' Medically reviewed doctor answers.';
  const by = doctorName ? ` — ${doctorName}.` : '';
  const tail = ' Madhavbaug Health Forum.';
  const raw = `${lead}${answerBit}${by}${tail}`;
  return raw.length <= 160 ? raw : `${raw.slice(0, 157).trim()}…`;
}

@Injectable()
export class SeoService {
  constructor(
    @InjectRepository(SeoPage)
    private readonly seoRepo: Repository<SeoPage>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Answer)
    private readonly answerRepo: Repository<Answer>,
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

  /** Admin: answered Q&A pages available for SEO editing. */
  async listAnsweredQuestionSeo() {
    const site = (process.env.FORUM_PUBLIC_SITE_URL ?? 'https://madhavbaug.org').replace(/\/$/, '');
    const questions = await this.questionRepo
      .createQueryBuilder('q')
      .where('q.forum_slug IS NOT NULL')
      .andWhere(
        `EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_published = 1)`,
      )
      .orderBy('q.updated_at', 'DESC')
      .getMany();

    if (questions.length === 0) return [];

    const answers = await this.answerRepo.find({
      where: { questionId: In(questions.map((q) => q.id)), isPublished: true },
      order: { createdAt: 'ASC' },
      relations: { doctor: true },
    });
    const firstAnswerByQuestion = new Map<string, Answer>();
    const answerCountByQuestion = new Map<string, number>();
    for (const a of answers) {
      answerCountByQuestion.set(a.questionId, (answerCountByQuestion.get(a.questionId) ?? 0) + 1);
      if (!firstAnswerByQuestion.has(a.questionId)) firstAnswerByQuestion.set(a.questionId, a);
    }

    const seoRows = await this.seoRepo.find({
      where: { slug: In(questions.map((q) => seoSlugForQuestion(q.id))) },
    });
    const seoBySlug = new Map(seoRows.map((s) => [s.slug, s]));

    return questions.map((q) => {
      const categorySlug = forumSlugForCategory(q.category);
      const publicPath =
        categorySlug && q.forumSlug ? `/forum/${categorySlug}/${q.forumSlug}` : null;
      const publicUrl = publicPath ? `${site}${publicPath}` : null;
      const first = firstAnswerByQuestion.get(q.id) ?? null;
      const doctorName = first?.doctor?.name ?? null;
      const autoTitle = autoSeoTitle(q.category, q.body);
      const autoDescription = autoSeoDescription(q.body, first?.answerText ?? null, doctorName);
      const override = seoBySlug.get(seoSlugForQuestion(q.id)) ?? null;

      return {
        questionId: q.id,
        forumSlug: q.forumSlug,
        category: q.category,
        categorySlug,
        questionPreview: extractQuestionTitle(q.body, 120),
        answerCount: answerCountByQuestion.get(q.id) ?? 0,
        doctorName,
        publicPath,
        publicUrl,
        inSitemap: Boolean(publicPath),
        autoTitle,
        autoDescription,
        seo: override
          ? {
              title: override.title,
              metaDescription: override.metaDescription,
              robots: override.robots ?? 'index,follow',
              updatedAt: override.updatedAt,
              isCustom: true,
            }
          : {
              title: autoTitle,
              metaDescription: autoDescription,
              robots: 'index,follow',
              updatedAt: null,
              isCustom: false,
            },
      };
    });
  }

  async upsertQuestionSeo(questionId: string, dto: UpsertQuestionSeoDto, adminUserId: string) {
    const question = await this.questionRepo.findOne({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found.');

    const publishedCount = await this.answerRepo.count({
      where: { questionId, isPublished: true },
    });
    if (publishedCount === 0) {
      throw new NotFoundException('SEO is only available for questions with a published doctor answer.');
    }

    const categorySlug = forumSlugForCategory(question.category);
    const site = (process.env.FORUM_PUBLIC_SITE_URL ?? 'https://madhavbaug.org').replace(/\/$/, '');
    const canonicalUrl =
      categorySlug && question.forumSlug
        ? `${site}/forum/${categorySlug}/${question.forumSlug}`
        : null;

    const slug = seoSlugForQuestion(questionId);
    const existing = await this.seoRepo.findOne({ where: { slug } });
    const first = await this.answerRepo.findOne({
      where: { questionId, isPublished: true },
      order: { createdAt: 'ASC' },
      relations: { doctor: true },
    });
    const autoTitle = autoSeoTitle(question.category, question.body);
    const autoDescription = autoSeoDescription(
      question.body,
      first?.answerText ?? null,
      first?.doctor?.name ?? null,
    );

    const record = this.seoRepo.create({
      id: existing?.id,
      slug,
      pageType: 'forum_question',
      title: (dto.title?.trim() || existing?.title || autoTitle).slice(0, 180),
      metaDescription:
        dto.metaDescription?.trim() ||
        existing?.metaDescription ||
        autoDescription,
      canonicalUrl: canonicalUrl ?? existing?.canonicalUrl ?? null,
      robots: dto.robots?.trim() || existing?.robots || 'index,follow',
      ogTitle: null,
      ogDescription: null,
      updatedBy: adminUserId,
    });
    const saved = await this.seoRepo.save(record);
    return {
      questionId,
      seo: {
        title: saved.title,
        metaDescription: saved.metaDescription,
        robots: saved.robots ?? 'index,follow',
        canonicalUrl: saved.canonicalUrl,
        isCustom: true,
        updatedAt: saved.updatedAt,
      },
    };
  }

  async getQuestionSeoOverride(questionId: string) {
    return this.seoRepo.findOne({ where: { slug: seoSlugForQuestion(questionId) } });
  }
}

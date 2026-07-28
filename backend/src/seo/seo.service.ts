import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
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

function parseInternalLinks(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim())
      .filter((x) => x.startsWith('/forum/'))
      .slice(0, 20);
  } catch {
    return [];
  }
}

function siteBase(): string {
  return (process.env.FORUM_PUBLIC_SITE_URL ?? 'https://madhavbaug.org').replace(/\/$/, '');
}

type HubDef = {
  slug: string;
  pageType: string;
  label: string;
  publicPath: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string;
  defaultFocusKeyword: string;
};

const HUB_PAGES: HubDef[] = [
  {
    slug: 'home',
    pageType: 'home',
    label: 'Forum homepage',
    publicPath: '/forum',
    defaultTitle: 'Ask Doctors Health Questions — Diabetes, Heart, BP & More',
    defaultDescription:
      'Ask health questions and get medically verified answers from licensed doctors. Diabetes, heart disease, hypertension, obesity, and preventive care — trusted Ayurvedic & modern medical guidance.',
    defaultKeywords: 'health forum India, ask doctor online, diabetes questions, heart health advice, medical Q&A, Madhavbaug',
    defaultFocusKeyword: 'ask doctor online',
  },
  {
    slug: 'ask',
    pageType: 'ask',
    label: 'Ask a question',
    publicPath: '/forum/ask',
    defaultTitle: 'Ask a Health Question — Madhavbaug Doctors',
    defaultDescription:
      'Submit your health question to Madhavbaug doctors. Get a doctor-reviewed answer for diabetes, heart, blood pressure, weight, and lifestyle concerns.',
    defaultKeywords: 'ask doctor question, Madhavbaug consultation, health Q&A',
    defaultFocusKeyword: 'ask a health question',
  },
  {
    slug: 'category-diabetes-management',
    pageType: 'category',
    label: 'Diabetes Management',
    publicPath: '/forum/diabetes-management',
    defaultTitle: 'Diabetes Questions Answered by Doctors',
    defaultDescription:
      'Browse medically reviewed diabetes answers from Madhavbaug doctors. Blood sugar, diet, lifestyle, and treatment guidance.',
    defaultKeywords: 'diabetes questions, diabetes management Ayurveda, blood sugar doctor answers',
    defaultFocusKeyword: 'diabetes management',
  },
  {
    slug: 'category-heart-disease-heart-blockage',
    pageType: 'category',
    label: 'Heart Disease & Heart Blockage',
    publicPath: '/forum/heart-disease-heart-blockage',
    defaultTitle: 'Heart Disease & Heart Blockage — Doctor Answers',
    defaultDescription:
      'Expert Madhavbaug guidance on heart disease, blockage, cholesterol, and cardiac lifestyle — doctor-reviewed Q&A.',
    defaultKeywords: 'heart disease questions, heart blockage Ayurveda, cardiac care Q&A',
    defaultFocusKeyword: 'heart disease',
  },
  {
    slug: 'category-obesity-metabolic-health',
    pageType: 'category',
    label: 'Obesity & Metabolic Health',
    publicPath: '/forum/obesity-metabolic-health',
    defaultTitle: 'Obesity & Metabolic Health — Expert Forum',
    defaultDescription:
      'Doctor-reviewed answers on weight management, metabolism, and sustainable lifestyle change from Madhavbaug clinicians.',
    defaultKeywords: 'obesity treatment questions, metabolic health Ayurveda, weight loss doctor advice',
    defaultFocusKeyword: 'obesity metabolic health',
  },
  {
    slug: 'category-hypertension-high-blood-pressure',
    pageType: 'category',
    label: 'Hypertension (High Blood Pressure)',
    publicPath: '/forum/hypertension-high-blood-pressure',
    defaultTitle: 'High Blood Pressure (Hypertension) — Doctor Q&A',
    defaultDescription:
      'Clinician-reviewed answers on blood pressure targets, monitoring, and lifestyle for hypertension from Madhavbaug doctors.',
    defaultKeywords: 'hypertension questions, high blood pressure Ayurveda, BP doctor answers',
    defaultFocusKeyword: 'hypertension',
  },
  {
    slug: 'category-lifestyle-disorders-preventive',
    pageType: 'category',
    label: 'Lifestyle Disorders (Preventive Focus)',
    publicPath: '/forum/lifestyle-disorders-preventive',
    defaultTitle: 'Lifestyle Disorders — Preventive Health Forum',
    defaultDescription:
      'Preventive health Q&A on stress, sleep, diet, and early screening — answers from Madhavbaug lifestyle medicine doctors.',
    defaultKeywords: 'lifestyle disorders, preventive health Q&A, Madhavbaug lifestyle medicine',
    defaultFocusKeyword: 'lifestyle disorders',
  },
];

function mapSeoFields(row: SeoPage | null, hub: HubDef) {
  const isCustom = Boolean(row);
  return {
    slug: hub.slug,
    pageType: hub.pageType,
    label: hub.label,
    publicPath: hub.publicPath,
    publicUrl: `${siteBase()}${hub.publicPath}`,
    isCustom,
    title: row?.title?.trim() || hub.defaultTitle,
    metaDescription: row?.metaDescription?.trim() || hub.defaultDescription,
    robots: row?.robots?.trim() || 'index,follow',
    focusKeyword: row?.focusKeyword?.trim() || hub.defaultFocusKeyword,
    keywords: row?.keywords?.trim() || hub.defaultKeywords,
    ogTitle: row?.ogTitle?.trim() || null,
    ogDescription: row?.ogDescription?.trim() || null,
    canonicalUrl: row?.canonicalUrl?.trim() || `${siteBase()}${hub.publicPath}`,
    updatedAt: row?.updatedAt ?? null,
    defaults: {
      title: hub.defaultTitle,
      metaDescription: hub.defaultDescription,
      focusKeyword: hub.defaultFocusKeyword,
      keywords: hub.defaultKeywords,
    },
  };
}

@Injectable()
export class SeoService implements OnModuleInit {
  private readonly logger = new Logger(SeoService.name);

  constructor(
    @InjectRepository(SeoPage)
    private readonly seoRepo: Repository<SeoPage>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Answer)
    private readonly answerRepo: Repository<Answer>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    const columns: Array<[string, string]> = [
      ['keywords', 'TEXT NULL'],
      ['internal_links', 'TEXT NULL'],
      ['focus_keyword', 'VARCHAR(120) NULL'],
    ];
    for (const [name, def] of columns) {
      try {
        await this.dataSource.query(`ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS ${name} ${def}`);
      } catch {
        try {
          await this.dataSource.query(`ALTER TABLE seo_pages ADD COLUMN ${name} ${def}`);
        } catch {
          /* already exists */
        }
      }
    }
  }

  async getBySlug(slug: string) {
    return this.seoRepo.findOne({ where: { slug } });
  }

  /** Public + admin: resolved hub/page SEO with defaults. */
  async getPublicPageSeo(slug: string) {
    const hub = HUB_PAGES.find((h) => h.slug === slug);
    if (!hub) {
      const row = await this.seoRepo.findOne({ where: { slug } });
      if (!row) throw new NotFoundException('SEO page not found.');
      return {
        slug: row.slug,
        pageType: row.pageType,
        label: row.slug,
        publicPath: null,
        publicUrl: row.canonicalUrl,
        isCustom: true,
        title: row.title,
        metaDescription: row.metaDescription,
        robots: row.robots ?? 'index,follow',
        focusKeyword: row.focusKeyword,
        keywords: row.keywords,
        ogTitle: row.ogTitle,
        ogDescription: row.ogDescription,
        canonicalUrl: row.canonicalUrl,
        updatedAt: row.updatedAt,
      };
    }
    const row = await this.seoRepo.findOne({ where: { slug: hub.slug } });
    return mapSeoFields(row, hub);
  }

  async listHubPages() {
    const rows = await this.seoRepo.find({
      where: { slug: In(HUB_PAGES.map((h) => h.slug)) },
    });
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    return HUB_PAGES.map((hub) => mapSeoFields(bySlug.get(hub.slug) ?? null, hub));
  }

  async upsertBySlug(slug: string, dto: UpsertSeoPageDto, adminUserId: string) {
    const hub = HUB_PAGES.find((h) => h.slug === slug);
    const existing = await this.seoRepo.findOne({ where: { slug } });
    const record = this.seoRepo.create({
      id: existing?.id,
      slug,
      pageType: dto.pageType ?? existing?.pageType ?? hub?.pageType ?? 'generic',
      title: (dto.title?.trim() || existing?.title || hub?.defaultTitle || slug).slice(0, 180),
      metaDescription:
        dto.metaDescription !== undefined
          ? dto.metaDescription.trim() || null
          : existing?.metaDescription ?? hub?.defaultDescription ?? null,
      canonicalUrl:
        dto.canonicalUrl?.trim() ||
        existing?.canonicalUrl ||
        (hub ? `${siteBase()}${hub.publicPath}` : null),
      robots: dto.robots?.trim() || existing?.robots || 'index,follow',
      focusKeyword:
        dto.focusKeyword !== undefined
          ? dto.focusKeyword.trim().slice(0, 120) || null
          : existing?.focusKeyword ?? hub?.defaultFocusKeyword ?? null,
      keywords:
        dto.keywords !== undefined
          ? dto.keywords.trim().slice(0, 500) || null
          : existing?.keywords ?? hub?.defaultKeywords ?? null,
      ogTitle:
        dto.ogTitle !== undefined
          ? dto.ogTitle.trim().slice(0, 180) || null
          : existing?.ogTitle ?? null,
      ogDescription:
        dto.ogDescription !== undefined
          ? dto.ogDescription.trim() || null
          : existing?.ogDescription ?? null,
      updatedBy: adminUserId,
    });
    return this.seoRepo.save(record);
  }

  /** Admin: answered Q&A pages available for SEO editing. */
  async listAnsweredQuestionSeo() {
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
      const publicUrl = publicPath ? `${siteBase()}${publicPath}` : null;
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
        seo: {
          title: override?.title?.trim() || autoTitle,
          metaDescription: override?.metaDescription?.trim() || autoDescription,
          robots: override?.robots ?? 'index,follow',
          focusKeyword: override?.focusKeyword ?? null,
          keywords: override?.keywords ?? null,
          ogTitle: override?.ogTitle ?? null,
          ogDescription: override?.ogDescription ?? null,
          canonicalUrl: override?.canonicalUrl ?? publicUrl,
          internalLinks: parseInternalLinks(override?.internalLinks),
          updatedAt: override?.updatedAt ?? null,
          isCustom: Boolean(override),
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
    const canonicalUrl =
      categorySlug && question.forumSlug
        ? `${siteBase()}/forum/${categorySlug}/${question.forumSlug}`
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
        dto.metaDescription?.trim() || existing?.metaDescription || autoDescription,
      canonicalUrl: canonicalUrl ?? existing?.canonicalUrl ?? null,
      robots: dto.robots?.trim() || existing?.robots || 'index,follow',
      focusKeyword:
        dto.focusKeyword !== undefined
          ? dto.focusKeyword.trim().slice(0, 120) || null
          : existing?.focusKeyword ?? null,
      keywords:
        dto.keywords !== undefined
          ? dto.keywords.trim().slice(0, 500) || null
          : existing?.keywords ?? null,
      ogTitle:
        dto.ogTitle !== undefined
          ? dto.ogTitle.trim().slice(0, 180) || null
          : existing?.ogTitle ?? null,
      ogDescription:
        dto.ogDescription !== undefined
          ? dto.ogDescription.trim() || null
          : existing?.ogDescription ?? null,
      internalLinks:
        dto.internalLinks !== undefined
          ? JSON.stringify(
              dto.internalLinks
                .map((x) => x.trim())
                .filter((x) => x.startsWith('/forum/'))
                .slice(0, 20),
            )
          : existing?.internalLinks ?? null,
      updatedBy: adminUserId,
    });
    const saved = await this.seoRepo.save(record);
    return {
      questionId,
      seo: {
        title: saved.title,
        metaDescription: saved.metaDescription,
        robots: saved.robots ?? 'index,follow',
        focusKeyword: saved.focusKeyword,
        keywords: saved.keywords,
        ogTitle: saved.ogTitle,
        ogDescription: saved.ogDescription,
        internalLinks: parseInternalLinks(saved.internalLinks),
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

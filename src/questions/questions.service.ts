import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, MoreThanOrEqual, Repository } from 'typeorm';
import { QuestionStatus } from '../common/enums/question-status.enum';
import { Role } from '../common/enums/role.enum';
import { Answer } from '../entities/answer.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { QuestionAssignment } from '../entities/question-assignment.entity';
import { QuestionFollowup } from '../entities/question-followup.entity';
import { Question } from '../entities/question.entity';
import { User } from '../entities/user.entity';
import { UsersService } from '../users/users.service';
import { buildForumSlug } from '../common/utils/slugify';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { CreateFollowupDto } from './dto/create-followup.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { FORUM_SLUG_TO_CATEGORIES, getCategoriesForForumSlug } from './forum-category-map';

@Injectable()
export class QuestionsService implements OnModuleInit {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(QuestionFollowup)
    private readonly followupRepo: Repository<QuestionFollowup>,
    @InjectRepository(Answer)
    private readonly answerRepo: Repository<Answer>,
    @InjectRepository(QuestionAssignment)
    private readonly assignmentRepo: Repository<QuestionAssignment>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly usersService: UsersService,
  ) {}

  /** Lowercased tags; empty means legacy profile (no filter — same as pre–expertise-queue behavior). */
  private async getDoctorNormalizedExpertise(doctorUserId: string): Promise<string[]> {
    const profile = await this.usersService.getDoctorProfileByUserId(doctorUserId);
    const tags = profile?.expertiseTags ?? [];
    return [...new Set(tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
  }

  private questionMatchesDoctorExpertise(questionCategory: string, normalizedExpertise: string[]): boolean {
    if (normalizedExpertise.length === 0) return true;
    const cat = questionCategory.trim().toLowerCase();
    return normalizedExpertise.includes(cat);
  }

  private async doctorMayAccessQuestion(doctorUserId: string, question: Question): Promise<boolean> {
    const questionId = question.id;
    const assigned = await this.assignmentRepo.findOne({ where: { questionId, doctorUserId } });
    if (assigned) return true;

    const assignRows = await this.assignmentRepo.find({ where: { questionId } });
    if (assignRows.some((a) => a.doctorUserId !== doctorUserId)) return false;

    const inPool =
      question.status === QuestionStatus.OPEN ||
      question.status === QuestionStatus.ASSIGNED ||
      question.status === QuestionStatus.ANSWERED;
    if (!inPool) return false;

    const expertise = await this.getDoctorNormalizedExpertise(doctorUserId);
    return this.questionMatchesDoctorExpertise(question.category, expertise);
  }

  async onModuleInit() {
    await this.backfillForumSlugs();
  }

  private async backfillForumSlugs() {
    const missing = await this.questionRepo.find({
      where: { forumSlug: IsNull() },
      select: ['id', 'title'],
    });
    for (const q of missing) {
      const forumSlug = buildForumSlug(q.title, q.id);
      await this.questionRepo.update({ id: q.id }, { forumSlug });
    }
  }

  async createQuestion(patientUserId: string, dto: CreateQuestionDto) {
    const question = await this.questionRepo.save(
      this.questionRepo.create({
        patientUserId,
        title: dto.title,
        body: dto.body,
        category: dto.category,
        status: QuestionStatus.OPEN,
      }),
    );
    const forumSlug = buildForumSlug(question.title, question.id);
    await this.questionRepo.update({ id: question.id }, { forumSlug });
    question.forumSlug = forumSlug;
    await this.log(patientUserId, 'question.create', 'question', question.id, { category: dto.category });
    return question;
  }

  async getMyQuestions(patientUserId: string, page = 1, limit = 20) {
    return this.questionRepo.find({
      where: { patientUserId },
      relations: { answers: true, assignments: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getQuestionThread(questionId: string, requesterId: string, requesterRole: Role) {
    const question = await this.questionRepo.findOne({
      where: { id: questionId },
      relations: { answers: true, followups: true, assignments: true },
    });
    if (!question) throw new NotFoundException('Question not found.');
    if (requesterRole === Role.PATIENT && question.patientUserId !== requesterId) {
      throw new NotFoundException('Question not found.');
    }
    if (requesterRole === Role.DOCTOR) {
      const ok = await this.doctorMayAccessQuestion(requesterId, question);
      if (!ok) throw new NotFoundException('Question not found.');
    }
    return question;
  }

  async addFollowup(questionId: string, patientUserId: string, dto: CreateFollowupDto) {
    const question = await this.questionRepo.findOne({ where: { id: questionId } });
    if (!question || question.patientUserId !== patientUserId) {
      throw new NotFoundException('Question not found.');
    }
    const followup = await this.followupRepo.save(
      this.followupRepo.create({
        questionId,
        patientUserId,
        message: dto.message,
        optionalContactName: dto.contactName ?? null,
        optionalContactPhone: dto.contactPhone ?? null,
      }),
    );
    await this.log(patientUserId, 'question.followup.create', 'question', questionId, null);
    return followup;
  }

  async listDoctorQuestions(doctorUserId: string, status?: QuestionStatus, page = 1, limit = 20) {
    const myPublishedRows = await this.answerRepo
      .createQueryBuilder('a')
      .select('a.question_id', 'questionId')
      .where('a.doctor_user_id = :docId', { docId: doctorUserId })
      .andWhere('a.is_published = :pub', { pub: true })
      .getRawMany<{ questionId: string }>();
    const myPublishedQuestionIds = new Set(myPublishedRows.map((r) => r.questionId));

    const normalizedExpertise = await this.getDoctorNormalizedExpertise(doctorUserId);

    const assignments = await this.assignmentRepo.find({
      where: { doctorUserId },
      relations: { question: true },
      order: { assignedAt: 'DESC' },
    });
    const assignedQuestions = assignments.map((a) => a.question).filter(Boolean);

    const poolCandidates = await this.questionRepo.find({
      where: [
        { status: QuestionStatus.OPEN },
        { status: QuestionStatus.ASSIGNED },
        { status: QuestionStatus.ANSWERED },
      ],
      order: { createdAt: 'DESC' },
      take: 500,
    });
    const poolIds = poolCandidates.map((q) => q.id);
    const poolAssignments =
      poolIds.length === 0
        ? []
        : await this.assignmentRepo.find({
            where: { questionId: In(poolIds) },
          });
    const assigneesByQuestion = new Map<string, Set<string>>();
    for (const row of poolAssignments) {
      let set = assigneesByQuestion.get(row.questionId);
      if (!set) {
        set = new Set();
        assigneesByQuestion.set(row.questionId, set);
      }
      set.add(row.doctorUserId);
    }

    const pool = poolCandidates.filter((q) => {
      if (myPublishedQuestionIds.has(q.id)) return false;
      const assignees = assigneesByQuestion.get(q.id);
      if (assignees?.has(doctorUserId)) return false;
      if (assignees && assignees.size > 0) return false;
      return this.questionMatchesDoctorExpertise(q.category, normalizedExpertise);
    });

    const assignedIds = new Set(assignedQuestions.map((q) => q.id));
    const byId = new Map<string, Question>();
    for (const q of pool) byId.set(q.id, q);
    for (const q of assignedQuestions) byId.set(q.id, q);

    let merged = [...byId.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (status) merged = merged.filter((q) => q.status === status);

    const start = (page - 1) * limit;
    const slice = merged.slice(start, start + limit);

    return slice.map((q) => ({
      id: q.id,
      title: q.title,
      body: q.body,
      category: q.category,
      status: q.status,
      createdAt: q.createdAt,
      assignedToMe: assignedIds.has(q.id),
      canAnswer: !myPublishedQuestionIds.has(q.id),
    }));
  }

  private assertAnswerHasBody(html: string) {
    const s = html?.trim() ?? '';
    if (!s) throw new BadRequestException('Answer cannot be empty.');
    if (/<img\b/i.test(s)) return;
    const text = s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length < 10) {
      throw new BadRequestException('Please write at least a short answer (or attach an image).');
    }
  }

  async addDoctorAnswer(doctorUserId: string, questionId: string, dto: CreateAnswerDto) {
    this.assertAnswerHasBody(dto.answerText);
    return this.questionRepo.manager.transaction(async (em) => {
      const qRepo = em.getRepository(Question);
      const aRepo = em.getRepository(Answer);
      const asRepo = em.getRepository(QuestionAssignment);

      const question = await qRepo
        .createQueryBuilder('q')
        .setLock('pessimistic_write')
        .where('q.id = :id', { id: questionId })
        .getOne();
      if (!question) throw new NotFoundException('Question not found.');

      const myPublishedCount = await aRepo.count({
        where: { questionId, doctorUserId, isPublished: true },
      });
      if (myPublishedCount > 0) {
        throw new ConflictException('You have already published an answer on this question.');
      }

      const assigned = await asRepo.findOne({ where: { doctorUserId, questionId } });
      if (!assigned) {
        const inOpenPool =
          question.status === QuestionStatus.OPEN ||
          question.status === QuestionStatus.ASSIGNED ||
          question.status === QuestionStatus.ANSWERED;
        if (!inOpenPool) {
          throw new ForbiddenException('You cannot answer this question.');
        }
        const otherAssign = await asRepo.find({ where: { questionId } });
        if (otherAssign.some((a) => a.doctorUserId !== doctorUserId)) {
          throw new ForbiddenException('This question is already assigned to another doctor.');
        }
        const expertise = await this.getDoctorNormalizedExpertise(doctorUserId);
        if (!this.questionMatchesDoctorExpertise(question.category, expertise)) {
          throw new ForbiddenException(
            'This question is outside your listed areas of expertise.',
          );
        }
      }

      const answer = await aRepo.save(
        aRepo.create({
          doctorUserId,
          questionId,
          answerText: dto.answerText,
          isPublished: true,
        }),
      );
      await qRepo.update({ id: questionId }, { status: QuestionStatus.ANSWERED });

      await this.log(doctorUserId, 'answer.create', 'question', questionId, { answerId: answer.id });
      return answer;
    });
  }

  async adminListQuestions(status?: QuestionStatus, page = 1, limit = 20) {
    return this.questionRepo.find({
      where: status ? { status } : {},
      relations: { answers: true, assignments: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async adminAssignDoctor(questionId: string, doctorUserId: string, adminUserId: string) {
    const [question, doctor] = await Promise.all([
      this.questionRepo.findOne({ where: { id: questionId } }),
      this.usersRepo.findOne({ where: { id: doctorUserId, role: Role.DOCTOR } }),
    ]);
    if (!question) throw new NotFoundException('Question not found.');
    if (!doctor) throw new NotFoundException('Doctor not found.');
    const existing = await this.assignmentRepo.findOne({ where: { questionId, doctorUserId } });
    if (!existing) {
      await this.assignmentRepo.save(
        this.assignmentRepo.create({
          questionId,
          doctorUserId,
          assignedBy: adminUserId,
        }),
      );
    }
    await this.questionRepo.update({ id: questionId }, { status: QuestionStatus.ASSIGNED });
    await this.log(adminUserId, 'question.assign', 'question', questionId, { doctorUserId });
    return { ok: true };
  }

  async adminUpdateStatus(questionId: string, status: QuestionStatus, adminUserId: string) {
    const question = await this.questionRepo.findOne({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found.');
    await this.questionRepo.update({ id: questionId }, { status });
    await this.log(adminUserId, 'question.status.update', 'question', questionId, { status });
    return { ok: true };
  }

  async adminDeleteQuestion(questionId: string, superadminUserId: string) {
    const question = await this.questionRepo.findOne({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found.');
    await this.questionRepo.delete({ id: questionId });
    await this.log(superadminUserId, 'question.delete', 'question', questionId, {
      category: question.category,
      forumSlug: question.forumSlug,
    });
    return { ok: true };
  }

  async adminDashboard() {
    const statusRows = await this.questionRepo
      .createQueryBuilder('q')
      .select('q.status', 'status')
      .addSelect('COUNT(q.id)', 'cnt')
      .groupBy('q.status')
      .getRawMany<{ status: string; cnt: string }>();

    const questionCounts: Record<string, number> = {};
    for (const r of statusRows) {
      questionCounts[r.status] = parseInt(r.cnt, 10);
    }

    const totalQuestions = await this.questionRepo.count();
    const doctors = await this.usersRepo.count({ where: { role: Role.DOCTOR } });
    const patients = await this.usersRepo.count({ where: { role: Role.PATIENT } });
    const platformStaff = await this.usersRepo.count({
      where: { role: In([Role.ADMIN, Role.SUPERADMIN]) },
    });

    const totalAnswers = await this.answerRepo.count();
    const publishedAnswers = await this.answerRepo.count({ where: { isPublished: true } });

    const catRaw = await this.questionRepo
      .createQueryBuilder('q')
      .select('q.category', 'category')
      .addSelect('COUNT(q.id)', 'cnt')
      .groupBy('q.category')
      .orderBy('cnt', 'DESC')
      .getRawMany<{ category: string; cnt: string }>();
    const questionCategoryCounts: Record<string, number> = {};
    for (const r of catRaw) {
      questionCategoryCounts[r.category] = parseInt(r.cnt, 10);
    }

    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const fourteenStart = new Date(todayUtc);
    fourteenStart.setUTCDate(fourteenStart.getUTCDate() - 13);
    const sevenStart = new Date(todayUtc);
    sevenStart.setUTCDate(sevenStart.getUTCDate() - 6);

    const trendDayKeys = this.utcDayKeysInclusive(fourteenStart, todayUtc);

    const signInRows = await this.auditRepo
      .createQueryBuilder('al')
      .select('DATE(al.created_at)', 'd')
      .addSelect('COUNT(al.id)', 'cnt')
      .where('al.action = :act', { act: 'auth.login' })
      .andWhere('al.created_at >= :from', { from: fourteenStart })
      .groupBy('DATE(al.created_at)')
      .orderBy('d', 'ASC')
      .getRawMany<{ d: string | Date; cnt: string }>();

    const activeRows = await this.auditRepo
      .createQueryBuilder('al')
      .select('DATE(al.created_at)', 'd')
      .addSelect('COUNT(DISTINCT al.actor_user_id)', 'cnt')
      .where('al.actor_user_id IS NOT NULL')
      .andWhere('al.created_at >= :from', { from: fourteenStart })
      .groupBy('DATE(al.created_at)')
      .orderBy('d', 'ASC')
      .getRawMany<{ d: string | Date; cnt: string }>();

    const newQRows = await this.questionRepo
      .createQueryBuilder('q')
      .select('DATE(q.created_at)', 'd')
      .addSelect('COUNT(q.id)', 'cnt')
      .where('q.created_at >= :from', { from: fourteenStart })
      .groupBy('DATE(q.created_at)')
      .orderBy('d', 'ASC')
      .getRawMany<{ d: string | Date; cnt: string }>();

    const signInMap = new Map(signInRows.map((r) => [this.normalizeDayKey(r.d), parseInt(r.cnt, 10)]));
    const activeMap = new Map(activeRows.map((r) => [this.normalizeDayKey(r.d), parseInt(r.cnt, 10)]));
    const newQMap = new Map(newQRows.map((r) => [this.normalizeDayKey(r.d), parseInt(r.cnt, 10)]));

    const trends = trendDayKeys.map((date) => ({
      date,
      signIns: signInMap.get(date) ?? 0,
      activeUsers: activeMap.get(date) ?? 0,
      newQuestions: newQMap.get(date) ?? 0,
    }));

    const signInsLast7Raw = await this.auditRepo
      .createQueryBuilder('al')
      .select('COUNT(al.id)', 'cnt')
      .where('al.action = :act', { act: 'auth.login' })
      .andWhere('al.created_at >= :from', { from: sevenStart })
      .getRawOne<{ cnt: string }>();

    const distinctActive7Raw = await this.auditRepo
      .createQueryBuilder('al')
      .select('COUNT(DISTINCT al.actor_user_id)', 'cnt')
      .where('al.actor_user_id IS NOT NULL')
      .andWhere('al.created_at >= :from', { from: sevenStart })
      .getRawOne<{ cnt: string }>();

    const newQuestions7d = await this.questionRepo.count({
      where: { createdAt: MoreThanOrEqual(sevenStart) },
    });

    const logs = await this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take: 25,
      relations: { actorUser: true },
    });

    const recentActivity = logs.map((l) => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      createdAt: l.createdAt,
      actorName: l.actorUser?.name ?? null,
    }));

    return {
      questionCounts,
      totalQuestions,
      userCounts: { doctors, patients, platformStaff },
      contentCounts: { answers: totalAnswers, publishedAnswers },
      questionCategoryCounts,
      trends,
      sessionSummary: {
        signInsLast7Days: parseInt(signInsLast7Raw?.cnt ?? '0', 10),
        distinctActiveUsersLast7Days: parseInt(distinctActive7Raw?.cnt ?? '0', 10),
        newQuestionsLast7Days: newQuestions7d,
      },
      recentActivity,
    };
  }

  private utcDayKeysInclusive(startUtc: Date, endUtc: Date): string[] {
    const out: string[] = [];
    const t = new Date(startUtc.getTime());
    const end = endUtc.getTime();
    while (t.getTime() <= end) {
      out.push(t.toISOString().slice(0, 10));
      t.setUTCDate(t.getUTCDate() + 1);
    }
    return out;
  }

  private normalizeDayKey(raw: string | Date): string {
    if (raw instanceof Date) return raw.toISOString().slice(0, 10);
    const s = String(raw);
    return s.length >= 10 ? s.slice(0, 10) : s;
  }

  private snippetText(body: string, max = 220): string {
    const t = body.replace(/\s+/g, ' ').trim();
    return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
  }

  private forumSlugForCategory(category: string): string | null {
    const normalized = category.trim().toLowerCase();
    for (const [slug, categories] of Object.entries(FORUM_SLUG_TO_CATEGORIES)) {
      if (categories.some((cat) => cat.trim().toLowerCase() === normalized)) return slug;
    }
    return null;
  }

  async getPublicHomeFeed() {
    const answeredRows = await this.questionRepo
      .createQueryBuilder('q')
      .where('q.status = :st', { st: QuestionStatus.ANSWERED })
      .andWhere('q.forum_slug IS NOT NULL')
      .andWhere(`EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_published = 1)`)
      .orderBy('q.created_at', 'DESC')
      .take(24)
      .getMany();

    const trendingRows = await this.questionRepo
      .createQueryBuilder('q')
      .where('q.forum_slug IS NOT NULL')
      .orderBy('q.created_at', 'DESC')
      .take(24)
      .getMany();

    const openAnswerCounts =
      trendingRows.length === 0
        ? []
        : await this.answerRepo
            .createQueryBuilder('a')
            .select('a.question_id', 'questionId')
            .addSelect('COUNT(a.id)', 'cnt')
            .where('a.question_id IN (:...ids)', { ids: trendingRows.map((q) => q.id) })
            .andWhere('a.is_published = 1')
            .groupBy('a.question_id')
            .getRawMany<{ questionId: string; cnt: string }>();
    const answerCountByQuestion = new Map(openAnswerCounts.map((r) => [r.questionId, parseInt(r.cnt, 10)]));

    const doctorIds = [
      ...new Set(
        answeredRows.length === 0
          ? []
          : (
              await this.answerRepo.find({
                where: { questionId: In(answeredRows.map((q) => q.id)), isPublished: true },
              })
            ).map((a) => a.doctorUserId),
      ),
    ];
    const doctors =
      doctorIds.length === 0
        ? []
        : await this.usersRepo.find({
            where: { id: In(doctorIds) },
            relations: { doctorProfile: true },
          });
    const doctorById = new Map(doctors.map((d) => [d.id, d]));

    const answersByQuestion = new Map<string, Answer[]>();
    const answeredAnswers =
      answeredRows.length === 0
        ? []
        : await this.answerRepo.find({
            where: { questionId: In(answeredRows.map((q) => q.id)), isPublished: true },
            order: { createdAt: 'ASC' },
          });
    for (const answer of answeredAnswers) {
      const list = answersByQuestion.get(answer.questionId) ?? [];
      list.push(answer);
      answersByQuestion.set(answer.questionId, list);
    }

    return {
      generatedAt: new Date().toISOString(),
      quickAnswer:
        answeredRows.length === 0
          ? null
          : (() => {
              const q = answeredRows[0];
              const answers = answersByQuestion.get(q.id) ?? [];
              const first = answers[0];
              const doc = first ? doctorById.get(first.doctorUserId) : null;
              return {
                questionSlug: q.forumSlug,
                categorySlug: this.forumSlugForCategory(q.category),
                category: q.category,
                questionTitle: q.title,
                answerSnippet: first ? this.snippetText(first.answerText.replace(/<[^>]+>/g, ' '), 220) : null,
                reviewedBy: doc
                  ? {
                      name: doc.name,
                      titles: doc.doctorProfile
                        ? `${doc.doctorProfile.degree}, ${doc.doctorProfile.qualification}`
                        : 'Verified doctor',
                      experienceYears: doc.doctorProfile?.clinicalExperienceYears ?? null,
                    }
                  : null,
                reviewedAt: first?.createdAt ?? q.createdAt,
              };
            })(),
      trending: trendingRows.slice(0, 8).map((q) => {
        const answerCount = answerCountByQuestion.get(q.id) ?? 0;
        const status =
          q.status === QuestionStatus.ANSWERED && answerCount > 0 ? ('answered' as const) : ('pending' as const);
        return {
          id: q.id,
          category: q.category,
          categorySlug: this.forumSlugForCategory(q.category),
          questionSlug: q.forumSlug,
          title: q.title,
          body: q.body,
          excerpt: this.snippetText(q.body),
          views: q.viewCount ?? 0,
          answers: answerCount,
          status,
          createdAt: q.createdAt,
        };
      }),
      recentlyAnswered: answeredRows.slice(0, 6).map((q) => {
        const answers = answersByQuestion.get(q.id) ?? [];
        const latestAnswer = answers[answers.length - 1];
        const doc = latestAnswer ? doctorById.get(latestAnswer.doctorUserId) : null;
        return {
          id: q.id,
          category: q.category,
          categorySlug: this.forumSlugForCategory(q.category),
          questionSlug: q.forumSlug,
          title: q.title,
          body: q.body,
          excerpt: this.snippetText(q.body),
          views: q.viewCount ?? 0,
          answeredAt: latestAnswer?.createdAt ?? q.createdAt,
          doctor: doc
            ? {
                name: doc.name,
                titles: doc.doctorProfile
                  ? `${doc.doctorProfile.degree}, ${doc.doctorProfile.qualification}`
                  : 'Verified doctor',
              }
            : null,
        };
      }),
    };
  }

  async getPublicForumStats(): Promise<Record<string, { answered: number; open: number }>> {
    const out: Record<string, { answered: number; open: number }> = {};
    for (const slug of Object.keys(FORUM_SLUG_TO_CATEGORIES)) {
      const cats = FORUM_SLUG_TO_CATEGORIES[slug];
      const answered = await this.questionRepo
        .createQueryBuilder('q')
        .where('q.category IN (:...cats)', { cats })
        .andWhere('q.status = :st', { st: QuestionStatus.ANSWERED })
        .andWhere(
          `EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_published = 1)`,
        )
        .getCount();
      const open = await this.questionRepo
        .createQueryBuilder('q')
        .where('q.category IN (:...cats)', { cats })
        .andWhere('q.status IN (:...ost)', {
          ost: [QuestionStatus.OPEN, QuestionStatus.ASSIGNED],
        })
        .andWhere(
          `NOT EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_published = 1)`,
        )
        .getCount();
      out[slug] = { answered, open };
    }
    return out;
  }

  async listPublicForumQuestions(
    categorySlug: string,
    page = 1,
    limit = 10,
    search?: string,
    filter: 'answered' | 'open' = 'answered',
    sort: 'latest' | 'views' = 'latest',
  ) {
    const cats = getCategoriesForForumSlug(categorySlug);
    if (!cats) throw new NotFoundException('Forum category not found.');

    const qb = this.questionRepo
      .createQueryBuilder('q')
      .where('q.category IN (:...cats)', { cats })
      .andWhere('q.forum_slug IS NOT NULL');

    if (search?.trim()) {
      const s = `%${search.trim().replace(/[%_]/g, '\\$&')}%`;
      qb.andWhere('(q.title LIKE :s OR q.body LIKE :s)', { s });
    }

    if (filter === 'open') {
      qb.andWhere('q.status IN (:...ost)', {
        ost: [QuestionStatus.OPEN, QuestionStatus.ASSIGNED],
      });
      qb.andWhere(
        `NOT EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_published = 1)`,
      );
    } else {
      qb.andWhere('q.status = :ans', { ans: QuestionStatus.ANSWERED });
      qb.andWhere(
        `EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_published = 1)`,
      );
    }

    if (sort === 'views') {
      qb.orderBy('q.view_count', 'DESC');
      qb.addOrderBy('q.created_at', 'DESC');
    } else {
      qb.orderBy('q.created_at', 'DESC');
    }
    qb.skip((page - 1) * limit).take(limit);
    const [rows, total] = await qb.getManyAndCount();

    const ids = rows.map((r) => r.id);
    const publishedAnswers =
      ids.length === 0
        ? []
        : await this.answerRepo.find({
            where: { questionId: In(ids), isPublished: true },
          });
    const byQuestion = new Map<string, typeof publishedAnswers>();
    for (const a of publishedAnswers) {
      const list = byQuestion.get(a.questionId) ?? [];
      list.push(a);
      byQuestion.set(a.questionId, list);
    }

    const items = rows.map((q) => {
      const ans = byQuestion.get(q.id) ?? [];
      const doctorCount = new Set(ans.map((a) => a.doctorUserId)).size;
      return {
        slug: q.forumSlug as string,
        title: q.title,
        body: q.body,
        snippet: this.snippetText(q.body),
        category: q.category,
        tag: q.category,
        createdAt: q.createdAt,
        doctorCount: Math.max(doctorCount, ans.length ? 1 : 0),
        answerCount: ans.length,
        viewCount: q.viewCount ?? 0,
      };
    });

    return { items, total, page, limit };
  }

  async getPublicForumQuestionDetail(categorySlug: string, questionSlugOrId: string) {
    const cats = getCategoriesForForumSlug(categorySlug);
    if (!cats) throw new NotFoundException('Forum category not found.');

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(questionSlugOrId);

    const question = isUuid
      ? await this.questionRepo.findOne({ where: { id: questionSlugOrId } })
      : await this.questionRepo.findOne({ where: { forumSlug: questionSlugOrId } });

    if (!question || !cats.includes(question.category)) {
      throw new NotFoundException('Question not found.');
    }

    const answers = await this.answerRepo.find({
      where: { questionId: question.id, isPublished: true },
      order: { createdAt: 'ASC' },
    });
    if (answers.length === 0) {
      throw new NotFoundException('This discussion is not published on the forum yet.');
    }

    await this.questionRepo.increment({ id: question.id }, 'viewCount', 1);
    const viewCount = (question.viewCount ?? 0) + 1;

    const doctorIds = [...new Set(answers.map((a) => a.doctorUserId))];
    const doctors =
      doctorIds.length === 0
        ? []
        : await this.usersRepo.find({
            where: { id: In(doctorIds) },
            relations: { doctorProfile: true },
          });
    const doctorById = new Map(doctors.map((d) => [d.id, d]));

    const relatedRows = await this.questionRepo
      .createQueryBuilder('q')
      .where('q.category IN (:...cats)', { cats })
      .andWhere('q.id != :id', { id: question.id })
      .andWhere('q.forum_slug IS NOT NULL')
      .andWhere('q.status = :st', { st: QuestionStatus.ANSWERED })
      .andWhere(
        `EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_published = 1)`,
      )
      .orderBy('q.created_at', 'DESC')
      .take(6)
      .getMany();

    const relatedIds = relatedRows.map((r) => r.id);
    const relAnswers =
      relatedIds.length === 0
        ? []
        : await this.answerRepo.find({ where: { questionId: In(relatedIds), isPublished: true } });
    const relCount = new Map<string, number>();
    for (const a of relAnswers) {
      relCount.set(a.questionId, (relCount.get(a.questionId) ?? 0) + 1);
    }

    const related = relatedRows.slice(0, 5).map((rq) => ({
      slug: rq.forumSlug as string,
      title: rq.title,
      answerCount: relCount.get(rq.id) ?? 1,
      viewCount: rq.viewCount ?? 0,
    }));

    return {
      slug: question.forumSlug as string,
      title: question.title,
      body: question.body,
      category: question.category,
      createdAt: question.createdAt,
      viewCount,
      patientAnonId: `MB-${question.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`,
      answers: answers.map((a) => {
        const doc = doctorById.get(a.doctorUserId);
        const profile = doc?.doctorProfile;
        return {
          id: a.id,
          answerHtml: a.answerText,
          createdAt: a.createdAt,
          doctor: {
            name: doc?.name ?? 'Verified doctor',
            titles: profile ? `${profile.degree} · ${profile.qualification}` : 'Medical reviewer',
            experienceYears: profile?.clinicalExperienceYears ?? null,
            photoUrl: profile?.photoUrl ?? null,
          },
        };
      }),
      related,
    };
  }

  async submitPublicForumReport(categorySlug: string, questionSlugOrId: string, message: string) {
    const cats = getCategoriesForForumSlug(categorySlug);
    if (!cats) throw new NotFoundException('Forum category not found.');

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(questionSlugOrId);

    const question = isUuid
      ? await this.questionRepo.findOne({ where: { id: questionSlugOrId } })
      : await this.questionRepo.findOne({ where: { forumSlug: questionSlugOrId } });

    if (!question || !cats.includes(question.category)) {
      throw new NotFoundException('Question not found.');
    }

    const hasPublished = await this.answerRepo.exist({
      where: { questionId: question.id, isPublished: true },
    });
    if (!hasPublished) {
      throw new NotFoundException('Question not found.');
    }

    await this.auditRepo.save(
      this.auditRepo.create({
        actorUserId: null,
        action: 'forum.question.report',
        entityType: 'question',
        entityId: question.id,
        payloadJson: {
          categorySlug,
          forumSlug: question.forumSlug,
          message: message.trim().slice(0, 2000),
        },
      }),
    );
    return { ok: true };
  }

  private async log(
    actorUserId: string | null,
    action: string,
    entityType: string,
    entityId: string | null,
    payloadJson: Record<string, unknown> | null,
  ) {
    await this.auditRepo.save(
      this.auditRepo.create({
        actorUserId,
        action,
        entityType,
        entityId,
        payloadJson,
      }),
    );
  }
}

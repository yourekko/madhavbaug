"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const question_status_enum_1 = require("../common/enums/question-status.enum");
const role_enum_1 = require("../common/enums/role.enum");
const answer_entity_1 = require("../entities/answer.entity");
const audit_log_entity_1 = require("../entities/audit-log.entity");
const question_assignment_entity_1 = require("../entities/question-assignment.entity");
const question_followup_entity_1 = require("../entities/question-followup.entity");
const question_entity_1 = require("../entities/question.entity");
const user_entity_1 = require("../entities/user.entity");
const users_service_1 = require("../users/users.service");
const slugify_1 = require("../common/utils/slugify");
const forum_category_map_1 = require("./forum-category-map");
let QuestionsService = class QuestionsService {
    questionRepo;
    followupRepo;
    answerRepo;
    assignmentRepo;
    usersRepo;
    auditRepo;
    usersService;
    constructor(questionRepo, followupRepo, answerRepo, assignmentRepo, usersRepo, auditRepo, usersService) {
        this.questionRepo = questionRepo;
        this.followupRepo = followupRepo;
        this.answerRepo = answerRepo;
        this.assignmentRepo = assignmentRepo;
        this.usersRepo = usersRepo;
        this.auditRepo = auditRepo;
        this.usersService = usersService;
    }
    async getDoctorNormalizedExpertise(doctorUserId) {
        const profile = await this.usersService.getDoctorProfileByUserId(doctorUserId);
        const tags = profile?.expertiseTags ?? [];
        return [...new Set(tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
    }
    questionMatchesDoctorExpertise(questionCategory, normalizedExpertise) {
        if (normalizedExpertise.length === 0)
            return true;
        const cat = questionCategory.trim().toLowerCase();
        return normalizedExpertise.includes(cat);
    }
    async doctorMayAccessQuestion(doctorUserId, question) {
        const questionId = question.id;
        const assigned = await this.assignmentRepo.findOne({ where: { questionId, doctorUserId } });
        if (assigned)
            return true;
        const hasPublishedAnswer = await this.answerRepo.exist({
            where: { questionId, isPublished: true },
        });
        const inOpenPool = !hasPublishedAnswer &&
            (question.status === question_status_enum_1.QuestionStatus.OPEN || question.status === question_status_enum_1.QuestionStatus.ASSIGNED);
        if (!inOpenPool)
            return false;
        const assignRows = await this.assignmentRepo.find({ where: { questionId } });
        if (assignRows.some((a) => a.doctorUserId !== doctorUserId))
            return false;
        const expertise = await this.getDoctorNormalizedExpertise(doctorUserId);
        return this.questionMatchesDoctorExpertise(question.category, expertise);
    }
    async onModuleInit() {
        await this.backfillForumSlugs();
    }
    async backfillForumSlugs() {
        const missing = await this.questionRepo.find({
            where: { forumSlug: (0, typeorm_2.IsNull)() },
            select: ['id', 'title'],
        });
        for (const q of missing) {
            const forumSlug = (0, slugify_1.buildForumSlug)(q.title, q.id);
            await this.questionRepo.update({ id: q.id }, { forumSlug });
        }
    }
    async createQuestion(patientUserId, dto) {
        const question = await this.questionRepo.save(this.questionRepo.create({
            patientUserId,
            title: dto.title,
            body: dto.body,
            category: dto.category,
            status: question_status_enum_1.QuestionStatus.OPEN,
        }));
        const forumSlug = (0, slugify_1.buildForumSlug)(question.title, question.id);
        await this.questionRepo.update({ id: question.id }, { forumSlug });
        question.forumSlug = forumSlug;
        await this.log(patientUserId, 'question.create', 'question', question.id, { category: dto.category });
        return question;
    }
    async getMyQuestions(patientUserId, page = 1, limit = 20) {
        return this.questionRepo.find({
            where: { patientUserId },
            relations: { answers: true, assignments: true },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
    }
    async getQuestionThread(questionId, requesterId, requesterRole) {
        const question = await this.questionRepo.findOne({
            where: { id: questionId },
            relations: { answers: true, followups: true, assignments: true },
        });
        if (!question)
            throw new common_1.NotFoundException('Question not found.');
        if (requesterRole === role_enum_1.Role.PATIENT && question.patientUserId !== requesterId) {
            throw new common_1.NotFoundException('Question not found.');
        }
        if (requesterRole === role_enum_1.Role.DOCTOR) {
            const ok = await this.doctorMayAccessQuestion(requesterId, question);
            if (!ok)
                throw new common_1.NotFoundException('Question not found.');
        }
        return question;
    }
    async addFollowup(questionId, patientUserId, dto) {
        const question = await this.questionRepo.findOne({ where: { id: questionId } });
        if (!question || question.patientUserId !== patientUserId) {
            throw new common_1.NotFoundException('Question not found.');
        }
        const followup = await this.followupRepo.save(this.followupRepo.create({
            questionId,
            patientUserId,
            message: dto.message,
            optionalContactName: dto.contactName ?? null,
            optionalContactPhone: dto.contactPhone ?? null,
        }));
        await this.log(patientUserId, 'question.followup.create', 'question', questionId, null);
        return followup;
    }
    async listDoctorQuestions(doctorUserId, status, page = 1, limit = 20) {
        const publishedRows = await this.answerRepo
            .createQueryBuilder('a')
            .select('a.question_id', 'questionId')
            .where('a.is_published = :pub', { pub: true })
            .distinct(true)
            .getRawMany();
        const answeredQuestionIds = new Set(publishedRows.map((r) => r.questionId));
        const normalizedExpertise = await this.getDoctorNormalizedExpertise(doctorUserId);
        const assignments = await this.assignmentRepo.find({
            where: { doctorUserId },
            relations: { question: true },
            order: { assignedAt: 'DESC' },
        });
        const assignedQuestions = assignments.map((a) => a.question).filter(Boolean);
        const poolCandidates = await this.questionRepo.find({
            where: [{ status: question_status_enum_1.QuestionStatus.OPEN }, { status: question_status_enum_1.QuestionStatus.ASSIGNED }],
            order: { createdAt: 'DESC' },
            take: 500,
        });
        const poolIds = poolCandidates.map((q) => q.id);
        const poolAssignments = poolIds.length === 0
            ? []
            : await this.assignmentRepo.find({
                where: { questionId: (0, typeorm_2.In)(poolIds) },
            });
        const assigneesByQuestion = new Map();
        for (const row of poolAssignments) {
            let set = assigneesByQuestion.get(row.questionId);
            if (!set) {
                set = new Set();
                assigneesByQuestion.set(row.questionId, set);
            }
            set.add(row.doctorUserId);
        }
        const pool = poolCandidates.filter((q) => {
            if (answeredQuestionIds.has(q.id))
                return false;
            const assignees = assigneesByQuestion.get(q.id);
            if (assignees?.has(doctorUserId))
                return false;
            if (assignees && assignees.size > 0)
                return false;
            return this.questionMatchesDoctorExpertise(q.category, normalizedExpertise);
        });
        const assignedIds = new Set(assignedQuestions.map((q) => q.id));
        const byId = new Map();
        for (const q of pool)
            byId.set(q.id, q);
        for (const q of assignedQuestions)
            byId.set(q.id, q);
        let merged = [...byId.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (status)
            merged = merged.filter((q) => q.status === status);
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
            canAnswer: !answeredQuestionIds.has(q.id),
        }));
    }
    assertAnswerHasBody(html) {
        const s = html?.trim() ?? '';
        if (!s)
            throw new common_1.BadRequestException('Answer cannot be empty.');
        if (/<img\b/i.test(s))
            return;
        const text = s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (text.length < 10) {
            throw new common_1.BadRequestException('Please write at least a short answer (or attach an image).');
        }
    }
    async addDoctorAnswer(doctorUserId, questionId, dto) {
        this.assertAnswerHasBody(dto.answerText);
        return this.questionRepo.manager.transaction(async (em) => {
            const qRepo = em.getRepository(question_entity_1.Question);
            const aRepo = em.getRepository(answer_entity_1.Answer);
            const asRepo = em.getRepository(question_assignment_entity_1.QuestionAssignment);
            const question = await qRepo
                .createQueryBuilder('q')
                .setLock('pessimistic_write')
                .where('q.id = :id', { id: questionId })
                .getOne();
            if (!question)
                throw new common_1.NotFoundException('Question not found.');
            const publishedCount = await aRepo.count({ where: { questionId, isPublished: true } });
            if (publishedCount > 0) {
                throw new common_1.ConflictException('This question has already been answered by another doctor.');
            }
            const assigned = await asRepo.findOne({ where: { doctorUserId, questionId } });
            if (!assigned) {
                const inOpenPool = question.status === question_status_enum_1.QuestionStatus.OPEN || question.status === question_status_enum_1.QuestionStatus.ASSIGNED;
                if (!inOpenPool) {
                    throw new common_1.ForbiddenException('You cannot answer this question.');
                }
                const otherAssign = await asRepo.find({ where: { questionId } });
                if (otherAssign.some((a) => a.doctorUserId !== doctorUserId)) {
                    throw new common_1.ForbiddenException('This question is already assigned to another doctor.');
                }
                const expertise = await this.getDoctorNormalizedExpertise(doctorUserId);
                if (!this.questionMatchesDoctorExpertise(question.category, expertise)) {
                    throw new common_1.ForbiddenException('This question is outside your listed areas of expertise.');
                }
            }
            const answer = await aRepo.save(aRepo.create({
                doctorUserId,
                questionId,
                answerText: dto.answerText,
                isPublished: true,
            }));
            await qRepo.update({ id: questionId }, { status: question_status_enum_1.QuestionStatus.ANSWERED });
            if (!assigned) {
                await asRepo.save(asRepo.create({
                    questionId,
                    doctorUserId,
                    assignedBy: null,
                }));
            }
            await this.log(doctorUserId, 'answer.create', 'question', questionId, { answerId: answer.id });
            return answer;
        });
    }
    async adminListQuestions(status, page = 1, limit = 20) {
        return this.questionRepo.find({
            where: status ? { status } : {},
            relations: { answers: true, assignments: true },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
    }
    async adminAssignDoctor(questionId, doctorUserId, adminUserId) {
        const [question, doctor] = await Promise.all([
            this.questionRepo.findOne({ where: { id: questionId } }),
            this.usersRepo.findOne({ where: { id: doctorUserId, role: role_enum_1.Role.DOCTOR } }),
        ]);
        if (!question)
            throw new common_1.NotFoundException('Question not found.');
        if (!doctor)
            throw new common_1.NotFoundException('Doctor not found.');
        const existing = await this.assignmentRepo.findOne({ where: { questionId, doctorUserId } });
        if (!existing) {
            await this.assignmentRepo.save(this.assignmentRepo.create({
                questionId,
                doctorUserId,
                assignedBy: adminUserId,
            }));
        }
        await this.questionRepo.update({ id: questionId }, { status: question_status_enum_1.QuestionStatus.ASSIGNED });
        await this.log(adminUserId, 'question.assign', 'question', questionId, { doctorUserId });
        return { ok: true };
    }
    async adminUpdateStatus(questionId, status, adminUserId) {
        const question = await this.questionRepo.findOne({ where: { id: questionId } });
        if (!question)
            throw new common_1.NotFoundException('Question not found.');
        await this.questionRepo.update({ id: questionId }, { status });
        await this.log(adminUserId, 'question.status.update', 'question', questionId, { status });
        return { ok: true };
    }
    async adminDashboard() {
        const statusRows = await this.questionRepo
            .createQueryBuilder('q')
            .select('q.status', 'status')
            .addSelect('COUNT(q.id)', 'cnt')
            .groupBy('q.status')
            .getRawMany();
        const questionCounts = {};
        for (const r of statusRows) {
            questionCounts[r.status] = parseInt(r.cnt, 10);
        }
        const totalQuestions = await this.questionRepo.count();
        const doctors = await this.usersRepo.count({ where: { role: role_enum_1.Role.DOCTOR } });
        const patients = await this.usersRepo.count({ where: { role: role_enum_1.Role.PATIENT } });
        const platformStaff = await this.usersRepo.count({
            where: { role: (0, typeorm_2.In)([role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN]) },
        });
        const totalAnswers = await this.answerRepo.count();
        const publishedAnswers = await this.answerRepo.count({ where: { isPublished: true } });
        const catRaw = await this.questionRepo
            .createQueryBuilder('q')
            .select('q.category', 'category')
            .addSelect('COUNT(q.id)', 'cnt')
            .groupBy('q.category')
            .orderBy('cnt', 'DESC')
            .getRawMany();
        const questionCategoryCounts = {};
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
            .getRawMany();
        const activeRows = await this.auditRepo
            .createQueryBuilder('al')
            .select('DATE(al.created_at)', 'd')
            .addSelect('COUNT(DISTINCT al.actor_user_id)', 'cnt')
            .where('al.actor_user_id IS NOT NULL')
            .andWhere('al.created_at >= :from', { from: fourteenStart })
            .groupBy('DATE(al.created_at)')
            .orderBy('d', 'ASC')
            .getRawMany();
        const newQRows = await this.questionRepo
            .createQueryBuilder('q')
            .select('DATE(q.created_at)', 'd')
            .addSelect('COUNT(q.id)', 'cnt')
            .where('q.created_at >= :from', { from: fourteenStart })
            .groupBy('DATE(q.created_at)')
            .orderBy('d', 'ASC')
            .getRawMany();
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
            .getRawOne();
        const distinctActive7Raw = await this.auditRepo
            .createQueryBuilder('al')
            .select('COUNT(DISTINCT al.actor_user_id)', 'cnt')
            .where('al.actor_user_id IS NOT NULL')
            .andWhere('al.created_at >= :from', { from: sevenStart })
            .getRawOne();
        const newQuestions7d = await this.questionRepo.count({
            where: { createdAt: (0, typeorm_2.MoreThanOrEqual)(sevenStart) },
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
    async adminDoctorAnalytics() {
        const doctors = await this.usersRepo.find({
            where: { role: role_enum_1.Role.DOCTOR },
            relations: { doctorProfile: true },
            order: { createdAt: 'DESC' },
        });
        const doctorIds = doctors.map((d) => d.id);
        if (doctorIds.length === 0)
            return [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const answerRows = await this.answerRepo
            .createQueryBuilder('a')
            .select('a.doctor_user_id', 'doctorUserId')
            .addSelect('COUNT(a.id)', 'totalAnswers')
            .addSelect('SUM(CASE WHEN a.created_at >= :thirtyDaysAgo THEN 1 ELSE 0 END)', 'answersLast30Days')
            .addSelect('MAX(a.created_at)', 'lastAnswerAt')
            .where('a.doctor_user_id IN (:...doctorIds)', { doctorIds })
            .andWhere('a.is_published = 1')
            .setParameter('thirtyDaysAgo', thirtyDaysAgo)
            .groupBy('a.doctor_user_id')
            .getRawMany();
        const assignRows = await this.assignmentRepo
            .createQueryBuilder('qa')
            .select('qa.doctor_user_id', 'doctorUserId')
            .addSelect('COUNT(DISTINCT qa.question_id)', 'assignedQuestions')
            .where('qa.doctor_user_id IN (:...doctorIds)', { doctorIds })
            .groupBy('qa.doctor_user_id')
            .getRawMany();
        const categoryRows = await this.answerRepo
            .createQueryBuilder('a')
            .innerJoin(question_entity_1.Question, 'q', 'q.id = a.question_id')
            .select('a.doctor_user_id', 'doctorUserId')
            .addSelect('q.category', 'category')
            .addSelect('COUNT(a.id)', 'cnt')
            .where('a.doctor_user_id IN (:...doctorIds)', { doctorIds })
            .andWhere('a.is_published = 1')
            .groupBy('a.doctor_user_id')
            .addGroupBy('q.category')
            .orderBy('cnt', 'DESC')
            .getRawMany();
        const answerByDoctor = new Map(answerRows.map((r) => [r.doctorUserId, r]));
        const assignByDoctor = new Map(assignRows.map((r) => [r.doctorUserId, parseInt(r.assignedQuestions, 10)]));
        const categoryByDoctor = new Map();
        for (const row of categoryRows) {
            const list = categoryByDoctor.get(row.doctorUserId) ?? [];
            list.push({ category: row.category, count: parseInt(row.cnt, 10) });
            categoryByDoctor.set(row.doctorUserId, list);
        }
        return doctors.map((doctor) => {
            const answer = answerByDoctor.get(doctor.id);
            return {
                doctorUserId: doctor.id,
                doctorName: doctor.name,
                email: doctor.email,
                phone: doctor.phone,
                whatsappNumber: doctor.doctorProfile?.whatsappNumber ?? null,
                branchName: doctor.doctorProfile?.branchName ?? null,
                profileLink: doctor.doctorProfile?.profileLink ?? null,
                totalAnswers: parseInt(answer?.totalAnswers ?? '0', 10),
                answersLast30Days: parseInt(answer?.answersLast30Days ?? '0', 10),
                assignedQuestions: assignByDoctor.get(doctor.id) ?? 0,
                lastAnswerAt: answer?.lastAnswerAt ?? null,
                categoriesAnswered: categoryByDoctor.get(doctor.id) ?? [],
            };
        });
    }
    async adminPatientAnalytics() {
        const patients = await this.usersRepo.find({
            where: { role: role_enum_1.Role.PATIENT },
            order: { createdAt: 'DESC' },
        });
        const patientIds = patients.map((p) => p.id);
        if (patientIds.length === 0)
            return [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const questionRows = await this.questionRepo
            .createQueryBuilder('q')
            .select('q.patient_user_id', 'patientUserId')
            .addSelect('COUNT(q.id)', 'totalQuestions')
            .addSelect('SUM(CASE WHEN q.created_at >= :thirtyDaysAgo THEN 1 ELSE 0 END)', 'questionsLast30Days')
            .addSelect('SUM(CASE WHEN q.status = :answeredStatus THEN 1 ELSE 0 END)', 'answeredQuestions')
            .addSelect('MAX(q.created_at)', 'lastQuestionAt')
            .where('q.patient_user_id IN (:...patientIds)', { patientIds })
            .setParameter('thirtyDaysAgo', thirtyDaysAgo)
            .setParameter('answeredStatus', question_status_enum_1.QuestionStatus.ANSWERED)
            .groupBy('q.patient_user_id')
            .getRawMany();
        const followupRows = await this.followupRepo
            .createQueryBuilder('f')
            .select('f.patient_user_id', 'patientUserId')
            .addSelect('COUNT(f.id)', 'followups')
            .where('f.patient_user_id IN (:...patientIds)', { patientIds })
            .groupBy('f.patient_user_id')
            .getRawMany();
        const categoryRows = await this.questionRepo
            .createQueryBuilder('q')
            .select('q.patient_user_id', 'patientUserId')
            .addSelect('q.category', 'category')
            .addSelect('COUNT(q.id)', 'cnt')
            .where('q.patient_user_id IN (:...patientIds)', { patientIds })
            .groupBy('q.patient_user_id')
            .addGroupBy('q.category')
            .orderBy('cnt', 'DESC')
            .getRawMany();
        const questionByPatient = new Map(questionRows.map((r) => [r.patientUserId, r]));
        const followupByPatient = new Map(followupRows.map((r) => [r.patientUserId, parseInt(r.followups, 10)]));
        const categoryByPatient = new Map();
        for (const row of categoryRows) {
            const list = categoryByPatient.get(row.patientUserId) ?? [];
            list.push({ category: row.category, count: parseInt(row.cnt, 10) });
            categoryByPatient.set(row.patientUserId, list);
        }
        return patients.map((patient) => {
            const question = questionByPatient.get(patient.id);
            return {
                patientUserId: patient.id,
                patientName: patient.name,
                email: patient.email,
                phone: patient.phone,
                totalQuestions: parseInt(question?.totalQuestions ?? '0', 10),
                questionsLast30Days: parseInt(question?.questionsLast30Days ?? '0', 10),
                answeredQuestions: parseInt(question?.answeredQuestions ?? '0', 10),
                followups: followupByPatient.get(patient.id) ?? 0,
                lastQuestionAt: question?.lastQuestionAt ?? null,
                categoriesAsked: categoryByPatient.get(patient.id) ?? [],
            };
        });
    }
    async adminDoctorAnalyticsDetail(doctorUserId) {
        const doctor = await this.usersRepo.findOne({
            where: { id: doctorUserId, role: role_enum_1.Role.DOCTOR },
            relations: { doctorProfile: true },
        });
        if (!doctor)
            throw new common_1.NotFoundException('Doctor not found.');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const answerRows = await this.answerRepo
            .createQueryBuilder('a')
            .innerJoin(question_entity_1.Question, 'q', 'q.id = a.question_id')
            .select('a.id', 'answerId')
            .addSelect('q.id', 'questionId')
            .addSelect('q.title', 'questionTitle')
            .addSelect('q.category', 'category')
            .addSelect('q.created_at', 'questionCreatedAt')
            .addSelect('a.created_at', 'answerCreatedAt')
            .where('a.doctor_user_id = :doctorUserId', { doctorUserId })
            .andWhere('a.is_published = 1')
            .orderBy('a.created_at', 'DESC')
            .getRawMany();
        const turnarounds = answerRows.map((row) => {
            const qTime = new Date(row.questionCreatedAt).getTime();
            const aTime = new Date(row.answerCreatedAt).getTime();
            return Math.max(0, (aTime - qTime) / (1000 * 60 * 60));
        });
        const totalAnswered = answerRows.length;
        const totalResponseHours = turnarounds.reduce((sum, h) => sum + h, 0);
        const averageResponseHours = totalAnswered > 0 ? totalResponseHours / totalAnswered : 0;
        const sorted = [...turnarounds].sort((a, b) => a - b);
        const medianResponseHours = sorted.length === 0
            ? 0
            : sorted.length % 2 === 1
                ? sorted[(sorted.length - 1) / 2]
                : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
        const categoryMap = new Map();
        for (const row of answerRows) {
            categoryMap.set(row.category, (categoryMap.get(row.category) ?? 0) + 1);
        }
        const categoriesAnswered = [...categoryMap.entries()]
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);
        const recentAnswers = answerRows.slice(0, 10).map((row) => {
            const qTime = new Date(row.questionCreatedAt).getTime();
            const aTime = new Date(row.answerCreatedAt).getTime();
            return {
                answerId: row.answerId,
                questionId: row.questionId,
                questionTitle: row.questionTitle,
                category: row.category,
                answeredAt: row.answerCreatedAt,
                turnaroundHours: Math.max(0, (aTime - qTime) / (1000 * 60 * 60)),
            };
        });
        const dailyRows = await this.answerRepo
            .createQueryBuilder('a')
            .select('DATE(a.created_at)', 'date')
            .addSelect('COUNT(a.id)', 'count')
            .where('a.doctor_user_id = :doctorUserId', { doctorUserId })
            .andWhere('a.is_published = 1')
            .andWhere('a.created_at >= :from', { from: thirtyDaysAgo })
            .groupBy('DATE(a.created_at)')
            .orderBy('date', 'ASC')
            .getRawMany();
        const activityRows = await this.auditRepo
            .createQueryBuilder('al')
            .select('al.action', 'action')
            .addSelect('COUNT(al.id)', 'count')
            .where('al.actor_user_id = :doctorUserId', { doctorUserId })
            .andWhere('al.created_at >= :from', { from: thirtyDaysAgo })
            .groupBy('al.action')
            .orderBy('count', 'DESC')
            .getRawMany();
        const answersLast30Days = answerRows.filter((row) => new Date(row.answerCreatedAt).getTime() >= thirtyDaysAgo.getTime()).length;
        return {
            doctor: {
                id: doctor.id,
                name: doctor.name,
                email: doctor.email,
                phone: doctor.phone,
                whatsappNumber: doctor.doctorProfile?.whatsappNumber ?? null,
                branchName: doctor.doctorProfile?.branchName ?? null,
                profileLink: doctor.doctorProfile?.profileLink ?? null,
            },
            summary: {
                totalAnswered,
                answersLast30Days,
                averageResponseHours: Number(averageResponseHours.toFixed(1)),
                medianResponseHours: Number(medianResponseHours.toFixed(1)),
                totalResponseHours: Number(totalResponseHours.toFixed(1)),
            },
            categoriesAnswered,
            dailyActivity: dailyRows.map((row) => ({
                date: this.normalizeDayKey(row.date),
                answered: parseInt(row.count, 10),
            })),
            activityBreakdown: activityRows.map((row) => ({
                action: row.action,
                count: parseInt(row.count, 10),
            })),
            recentAnswers,
        };
    }
    utcDayKeysInclusive(startUtc, endUtc) {
        const out = [];
        const t = new Date(startUtc.getTime());
        const end = endUtc.getTime();
        while (t.getTime() <= end) {
            out.push(t.toISOString().slice(0, 10));
            t.setUTCDate(t.getUTCDate() + 1);
        }
        return out;
    }
    normalizeDayKey(raw) {
        if (raw instanceof Date)
            return raw.toISOString().slice(0, 10);
        const s = String(raw);
        return s.length >= 10 ? s.slice(0, 10) : s;
    }
    snippetText(body, max = 220) {
        const t = body.replace(/\s+/g, ' ').trim();
        return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
    }
    forumSlugForCategory(category) {
        const normalized = category.trim().toLowerCase();
        for (const [slug, categories] of Object.entries(forum_category_map_1.FORUM_SLUG_TO_CATEGORIES)) {
            if (categories.some((cat) => cat.trim().toLowerCase() === normalized))
                return slug;
        }
        return null;
    }
    async getPublicHomeFeed() {
        const answeredRows = await this.questionRepo
            .createQueryBuilder('q')
            .where('q.status = :st', { st: question_status_enum_1.QuestionStatus.ANSWERED })
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
        const openAnswerCounts = trendingRows.length === 0
            ? []
            : await this.answerRepo
                .createQueryBuilder('a')
                .select('a.question_id', 'questionId')
                .addSelect('COUNT(a.id)', 'cnt')
                .where('a.question_id IN (:...ids)', { ids: trendingRows.map((q) => q.id) })
                .andWhere('a.is_published = 1')
                .groupBy('a.question_id')
                .getRawMany();
        const answerCountByQuestion = new Map(openAnswerCounts.map((r) => [r.questionId, parseInt(r.cnt, 10)]));
        const doctorIds = [
            ...new Set(answeredRows.length === 0
                ? []
                : (await this.answerRepo.find({
                    where: { questionId: (0, typeorm_2.In)(answeredRows.map((q) => q.id)), isPublished: true },
                })).map((a) => a.doctorUserId)),
        ];
        const doctors = doctorIds.length === 0
            ? []
            : await this.usersRepo.find({
                where: { id: (0, typeorm_2.In)(doctorIds) },
                relations: { doctorProfile: true },
            });
        const doctorById = new Map(doctors.map((d) => [d.id, d]));
        const answersByQuestion = new Map();
        const answeredAnswers = answeredRows.length === 0
            ? []
            : await this.answerRepo.find({
                where: { questionId: (0, typeorm_2.In)(answeredRows.map((q) => q.id)), isPublished: true },
                order: { createdAt: 'ASC' },
            });
        for (const answer of answeredAnswers) {
            const list = answersByQuestion.get(answer.questionId) ?? [];
            list.push(answer);
            answersByQuestion.set(answer.questionId, list);
        }
        return {
            generatedAt: new Date().toISOString(),
            quickAnswer: answeredRows.length === 0
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
                const status = q.status === question_status_enum_1.QuestionStatus.ANSWERED && answerCount > 0 ? 'answered' : 'pending';
                return {
                    id: q.id,
                    category: q.category,
                    categorySlug: this.forumSlugForCategory(q.category),
                    questionSlug: q.forumSlug,
                    title: q.title,
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
    async getPublicForumStats() {
        const out = {};
        for (const slug of Object.keys(forum_category_map_1.FORUM_SLUG_TO_CATEGORIES)) {
            const cats = forum_category_map_1.FORUM_SLUG_TO_CATEGORIES[slug];
            const answered = await this.questionRepo
                .createQueryBuilder('q')
                .where('q.category IN (:...cats)', { cats })
                .andWhere('q.status = :st', { st: question_status_enum_1.QuestionStatus.ANSWERED })
                .andWhere(`EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_published = 1)`)
                .getCount();
            const open = await this.questionRepo
                .createQueryBuilder('q')
                .where('q.category IN (:...cats)', { cats })
                .andWhere('q.status IN (:...ost)', {
                ost: [question_status_enum_1.QuestionStatus.OPEN, question_status_enum_1.QuestionStatus.ASSIGNED],
            })
                .andWhere(`NOT EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_published = 1)`)
                .getCount();
            out[slug] = { answered, open };
        }
        return out;
    }
    async listPublicForumQuestions(categorySlug, page = 1, limit = 10, search, filter = 'answered', sort = 'latest') {
        const cats = (0, forum_category_map_1.getCategoriesForForumSlug)(categorySlug);
        if (!cats)
            throw new common_1.NotFoundException('Forum category not found.');
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
                ost: [question_status_enum_1.QuestionStatus.OPEN, question_status_enum_1.QuestionStatus.ASSIGNED],
            });
            qb.andWhere(`NOT EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_published = 1)`);
        }
        else {
            qb.andWhere('q.status = :ans', { ans: question_status_enum_1.QuestionStatus.ANSWERED });
            qb.andWhere(`EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_published = 1)`);
        }
        if (sort === 'views') {
            qb.orderBy('q.view_count', 'DESC');
            qb.addOrderBy('q.created_at', 'DESC');
        }
        else {
            qb.orderBy('q.created_at', 'DESC');
        }
        qb.skip((page - 1) * limit).take(limit);
        const [rows, total] = await qb.getManyAndCount();
        const ids = rows.map((r) => r.id);
        const publishedAnswers = ids.length === 0
            ? []
            : await this.answerRepo.find({
                where: { questionId: (0, typeorm_2.In)(ids), isPublished: true },
            });
        const byQuestion = new Map();
        for (const a of publishedAnswers) {
            const list = byQuestion.get(a.questionId) ?? [];
            list.push(a);
            byQuestion.set(a.questionId, list);
        }
        const items = rows.map((q) => {
            const ans = byQuestion.get(q.id) ?? [];
            const doctorCount = new Set(ans.map((a) => a.doctorUserId)).size;
            return {
                slug: q.forumSlug,
                title: q.title,
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
    async getPublicForumQuestionDetail(categorySlug, questionSlugOrId) {
        const cats = (0, forum_category_map_1.getCategoriesForForumSlug)(categorySlug);
        if (!cats)
            throw new common_1.NotFoundException('Forum category not found.');
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(questionSlugOrId);
        const question = isUuid
            ? await this.questionRepo.findOne({ where: { id: questionSlugOrId } })
            : await this.questionRepo.findOne({ where: { forumSlug: questionSlugOrId } });
        if (!question || !cats.includes(question.category)) {
            throw new common_1.NotFoundException('Question not found.');
        }
        const answers = await this.answerRepo.find({
            where: { questionId: question.id, isPublished: true },
            order: { createdAt: 'ASC' },
        });
        if (answers.length === 0) {
            throw new common_1.NotFoundException('This discussion is not published on the forum yet.');
        }
        await this.questionRepo.increment({ id: question.id }, 'viewCount', 1);
        const viewCount = (question.viewCount ?? 0) + 1;
        const doctorIds = [...new Set(answers.map((a) => a.doctorUserId))];
        const doctors = doctorIds.length === 0
            ? []
            : await this.usersRepo.find({
                where: { id: (0, typeorm_2.In)(doctorIds) },
                relations: { doctorProfile: true },
            });
        const doctorById = new Map(doctors.map((d) => [d.id, d]));
        const relatedRows = await this.questionRepo
            .createQueryBuilder('q')
            .where('q.category IN (:...cats)', { cats })
            .andWhere('q.id != :id', { id: question.id })
            .andWhere('q.forum_slug IS NOT NULL')
            .andWhere('q.status = :st', { st: question_status_enum_1.QuestionStatus.ANSWERED })
            .andWhere(`EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.is_published = 1)`)
            .orderBy('q.created_at', 'DESC')
            .take(6)
            .getMany();
        const relatedIds = relatedRows.map((r) => r.id);
        const relAnswers = relatedIds.length === 0
            ? []
            : await this.answerRepo.find({ where: { questionId: (0, typeorm_2.In)(relatedIds), isPublished: true } });
        const relCount = new Map();
        for (const a of relAnswers) {
            relCount.set(a.questionId, (relCount.get(a.questionId) ?? 0) + 1);
        }
        const related = relatedRows.slice(0, 5).map((rq) => ({
            slug: rq.forumSlug,
            title: rq.title,
            answerCount: relCount.get(rq.id) ?? 1,
            viewCount: rq.viewCount ?? 0,
        }));
        return {
            slug: question.forumSlug,
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
    async submitPublicForumReport(categorySlug, questionSlugOrId, message) {
        const cats = (0, forum_category_map_1.getCategoriesForForumSlug)(categorySlug);
        if (!cats)
            throw new common_1.NotFoundException('Forum category not found.');
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(questionSlugOrId);
        const question = isUuid
            ? await this.questionRepo.findOne({ where: { id: questionSlugOrId } })
            : await this.questionRepo.findOne({ where: { forumSlug: questionSlugOrId } });
        if (!question || !cats.includes(question.category)) {
            throw new common_1.NotFoundException('Question not found.');
        }
        const hasPublished = await this.answerRepo.exist({
            where: { questionId: question.id, isPublished: true },
        });
        if (!hasPublished) {
            throw new common_1.NotFoundException('Question not found.');
        }
        await this.auditRepo.save(this.auditRepo.create({
            actorUserId: null,
            action: 'forum.question.report',
            entityType: 'question',
            entityId: question.id,
            payloadJson: {
                categorySlug,
                forumSlug: question.forumSlug,
                message: message.trim().slice(0, 2000),
            },
        }));
        return { ok: true };
    }
    async log(actorUserId, action, entityType, entityId, payloadJson) {
        await this.auditRepo.save(this.auditRepo.create({
            actorUserId,
            action,
            entityType,
            entityId,
            payloadJson,
        }));
    }
};
exports.QuestionsService = QuestionsService;
exports.QuestionsService = QuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __param(1, (0, typeorm_1.InjectRepository)(question_followup_entity_1.QuestionFollowup)),
    __param(2, (0, typeorm_1.InjectRepository)(answer_entity_1.Answer)),
    __param(3, (0, typeorm_1.InjectRepository)(question_assignment_entity_1.QuestionAssignment)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(5, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService])
], QuestionsService);
//# sourceMappingURL=questions.service.js.map
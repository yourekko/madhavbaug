import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { QuestionStatus } from '../common/enums/question-status.enum';
import { Role } from '../common/enums/role.enum';
import { Answer } from '../entities/answer.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { QuestionAssignment } from '../entities/question-assignment.entity';
import { QuestionFollowup } from '../entities/question-followup.entity';
import { Question } from '../entities/question.entity';
import { User } from '../entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { CreateFollowupDto } from './dto/create-followup.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
export declare class QuestionsService implements OnModuleInit {
    private readonly questionRepo;
    private readonly followupRepo;
    private readonly answerRepo;
    private readonly assignmentRepo;
    private readonly usersRepo;
    private readonly auditRepo;
    private readonly usersService;
    constructor(questionRepo: Repository<Question>, followupRepo: Repository<QuestionFollowup>, answerRepo: Repository<Answer>, assignmentRepo: Repository<QuestionAssignment>, usersRepo: Repository<User>, auditRepo: Repository<AuditLog>, usersService: UsersService);
    private getDoctorNormalizedExpertise;
    private questionMatchesDoctorExpertise;
    private doctorMayAccessQuestion;
    onModuleInit(): Promise<void>;
    private backfillForumSlugs;
    createQuestion(patientUserId: string, dto: CreateQuestionDto): Promise<Question>;
    getMyQuestions(patientUserId: string, page?: number, limit?: number): Promise<Question[]>;
    getQuestionThread(questionId: string, requesterId: string, requesterRole: Role): Promise<Question>;
    addFollowup(questionId: string, patientUserId: string, dto: CreateFollowupDto): Promise<QuestionFollowup>;
    listDoctorQuestions(doctorUserId: string, status?: QuestionStatus, page?: number, limit?: number): Promise<{
        id: string;
        title: string;
        body: string;
        category: string;
        status: QuestionStatus;
        createdAt: Date;
        assignedToMe: boolean;
        canAnswer: boolean;
    }[]>;
    private assertAnswerHasBody;
    addDoctorAnswer(doctorUserId: string, questionId: string, dto: CreateAnswerDto): Promise<Answer>;
    adminListQuestions(status?: QuestionStatus, page?: number, limit?: number): Promise<Question[]>;
    adminAssignDoctor(questionId: string, doctorUserId: string, adminUserId: string): Promise<{
        ok: boolean;
    }>;
    adminUpdateStatus(questionId: string, status: QuestionStatus, adminUserId: string): Promise<{
        ok: boolean;
    }>;
    adminDashboard(): Promise<{
        questionCounts: Record<string, number>;
        totalQuestions: number;
        userCounts: {
            doctors: number;
            patients: number;
            platformStaff: number;
        };
        contentCounts: {
            answers: number;
            publishedAnswers: number;
        };
        questionCategoryCounts: Record<string, number>;
        trends: {
            date: string;
            signIns: number;
            activeUsers: number;
            newQuestions: number;
        }[];
        sessionSummary: {
            signInsLast7Days: number;
            distinctActiveUsersLast7Days: number;
            newQuestionsLast7Days: number;
        };
        recentActivity: {
            id: string;
            action: string;
            entityType: string;
            entityId: string | null;
            createdAt: Date;
            actorName: string | null;
        }[];
    }>;
    adminDoctorAnalytics(): Promise<{
        doctorUserId: string;
        doctorName: string;
        email: string | null;
        phone: string | null;
        whatsappNumber: string | null;
        branchName: string | null;
        profileLink: string | null;
        totalAnswers: number;
        answersLast30Days: number;
        assignedQuestions: number;
        lastAnswerAt: string | null;
        categoriesAnswered: {
            category: string;
            count: number;
        }[];
    }[]>;
    adminPatientAnalytics(): Promise<{
        patientUserId: string;
        patientName: string;
        email: string | null;
        phone: string | null;
        totalQuestions: number;
        questionsLast30Days: number;
        answeredQuestions: number;
        followups: number;
        lastQuestionAt: string | null;
        categoriesAsked: {
            category: string;
            count: number;
        }[];
    }[]>;
    adminDoctorAnalyticsDetail(doctorUserId: string): Promise<{
        doctor: {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            whatsappNumber: string | null;
            branchName: string | null;
            profileLink: string | null;
        };
        summary: {
            totalAnswered: number;
            answersLast30Days: number;
            averageResponseHours: number;
            medianResponseHours: number;
            totalResponseHours: number;
        };
        categoriesAnswered: {
            category: string;
            count: number;
        }[];
        dailyActivity: {
            date: string;
            answered: number;
        }[];
        activityBreakdown: {
            action: string;
            count: number;
        }[];
        recentAnswers: {
            answerId: string;
            questionId: string;
            questionTitle: string;
            category: string;
            answeredAt: string;
            turnaroundHours: number;
        }[];
    }>;
    private utcDayKeysInclusive;
    private normalizeDayKey;
    private snippetText;
    private forumSlugForCategory;
    getPublicHomeFeed(): Promise<{
        generatedAt: string;
        quickAnswer: {
            questionSlug: string | null;
            categorySlug: string | null;
            category: string;
            questionTitle: string;
            answerSnippet: string | null;
            reviewedBy: {
                name: string;
                titles: string;
                experienceYears: number | null;
            } | null;
            reviewedAt: Date;
        } | null;
        trending: {
            id: string;
            category: string;
            categorySlug: string | null;
            questionSlug: string | null;
            title: string;
            excerpt: string;
            views: number;
            answers: number;
            status: "answered" | "pending";
            createdAt: Date;
        }[];
        recentlyAnswered: {
            id: string;
            category: string;
            categorySlug: string | null;
            questionSlug: string | null;
            title: string;
            excerpt: string;
            views: number;
            answeredAt: Date;
            doctor: {
                name: string;
                titles: string;
            } | null;
        }[];
    }>;
    getPublicForumStats(): Promise<Record<string, {
        answered: number;
        open: number;
    }>>;
    listPublicForumQuestions(categorySlug: string, page?: number, limit?: number, search?: string, filter?: 'answered' | 'open', sort?: 'latest' | 'views'): Promise<{
        items: {
            slug: string;
            title: string;
            snippet: string;
            category: string;
            tag: string;
            createdAt: Date;
            doctorCount: number;
            answerCount: number;
            viewCount: number;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getPublicForumQuestionDetail(categorySlug: string, questionSlugOrId: string): Promise<{
        slug: string;
        title: string;
        body: string;
        category: string;
        createdAt: Date;
        viewCount: number;
        patientAnonId: string;
        answers: {
            id: string;
            answerHtml: string;
            createdAt: Date;
            doctor: {
                name: string;
                titles: string;
                experienceYears: number | null;
                photoUrl: string | null;
            };
        }[];
        related: {
            slug: string;
            title: string;
            answerCount: number;
            viewCount: number;
        }[];
    }>;
    submitPublicForumReport(categorySlug: string, questionSlugOrId: string, message: string): Promise<{
        ok: boolean;
    }>;
    private log;
}

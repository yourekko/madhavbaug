import type { Request } from 'express';
import { ForumReportDto } from './dto/forum-report.dto';
import { QuestionsService } from './questions.service';
export declare class ForumPublicController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    stats(): Promise<Record<string, {
        answered: number;
        open: number;
    }>>;
    homeFeed(): Promise<{
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
            body: string;
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
            body: string;
            excerpt: string;
            views: number;
            answeredAt: Date;
            doctor: {
                name: string;
                titles: string;
            } | null;
        }[];
    }>;
    list(categorySlug: string, page?: string, limit?: string, search?: string, filter?: string, sort?: string): Promise<{
        items: {
            slug: string;
            title: string;
            body: string;
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
    detail(req: Request, viewerId: string | undefined, categorySlug: string, questionSlug: string): Promise<{
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
                bio: string | null;
                branchName: string | null;
                profileLink: string | null;
            };
        }[];
        related: {
            slug: string;
            title: string;
            answerCount: number;
            viewCount: number;
        }[];
    }>;
    report(categorySlug: string, questionSlug: string, dto: ForumReportDto): Promise<{
        ok: boolean;
    }>;
}

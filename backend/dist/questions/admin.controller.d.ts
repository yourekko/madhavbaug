import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { QuestionStatus } from '../common/enums/question-status.enum';
import { Role } from '../common/enums/role.enum';
import { UsersService } from '../users/users.service';
import { AssignDoctorDto } from './dto/assign-doctor.dto';
import { UpdateQuestionStatusDto } from './dto/update-question-status.dto';
import { QuestionsService } from './questions.service';
import { SetUserActiveDto } from '../users/dto/set-user-active.dto';
export declare class AdminController {
    private readonly questionsService;
    private readonly usersService;
    constructor(questionsService: QuestionsService, usersService: UsersService);
    dashboard(): Promise<{
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
    questions(status?: QuestionStatus, page?: string, limit?: string, category?: string): Promise<{
        id: string;
        title: string;
        body: string;
        category: string;
        status: QuestionStatus;
        patientUserId: string;
        createdAt: Date;
        patientAgeGroup: string | null;
        patientGender: string | null;
        patientHistory: string | null;
        patient: {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            signupLocation: string | null;
            memberSince: Date;
            accountUpdatedAt: Date;
            isActive: boolean;
            signInMethod: "google" | "phone_or_email";
        } | null;
        answers: import("../entities/answer.entity").Answer[] | undefined;
        assignments: import("../entities/question-assignment.entity").QuestionAssignment[] | undefined;
    }[]>;
    updateStatus(id: string, dto: UpdateQuestionStatusDto, user: JwtPayload): Promise<{
        ok: boolean;
    }>;
    assignDoctor(id: string, dto: AssignDoctorDto, user: JwtPayload): Promise<{
        ok: boolean;
    }>;
    deleteQuestion(id: string, user: JwtPayload): Promise<{
        ok: boolean;
    }>;
    doctors(): Promise<import("../entities/user.entity").User[]>;
    doctorReports(): Promise<{
        doctorUserId: string;
        doctorName: string;
        email: string | null;
        phone: string | null;
        isActive: boolean;
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
    doctorDetail(doctorUserId: string): Promise<{
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
    patientReports(): Promise<{
        patientUserId: string;
        patientName: string;
        email: string | null;
        phone: string | null;
        signupLocation: string | null;
        isActive: boolean;
        memberSince: Date;
        accountUpdatedAt: Date;
        signInMethod: "google" | "phone_or_email";
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
    setUserActive(id: string, dto: SetUserActiveDto, user: JwtPayload): Promise<{
        ok: boolean;
        userId: string;
        role: Role.PATIENT | Role.DOCTOR;
        isActive: boolean;
    }>;
}

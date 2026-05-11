import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { QuestionStatus } from '../common/enums/question-status.enum';
import { Role } from '../common/enums/role.enum';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { QuestionsService } from './questions.service';
export declare class DoctorController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    list(user: JwtPayload, status?: QuestionStatus, page?: string, limit?: string): Promise<{
        id: string;
        title: string;
        body: string;
        category: string;
        status: QuestionStatus;
        createdAt: Date;
        assignedToMe: boolean;
        canAnswer: boolean;
    }[]>;
    detail(user: JwtPayload, id: string): Promise<{
        id: string;
        patientUserId: string;
        title: string;
        body: string;
        category: string;
        status: QuestionStatus;
        forumSlug: string | null;
        viewCount: number;
        createdAt: Date;
        updatedAt: Date;
        patientAgeGroup: string | null;
        patientGender: string | null;
        patientHistory: string | null;
        followups: import("../entities/question-followup.entity").QuestionFollowup[] | undefined;
        assignments: import("../entities/question-assignment.entity").QuestionAssignment[] | undefined;
        answers: {
            id: string;
            questionId: string;
            doctorUserId: string;
            answerText: string;
            isPublished: boolean;
            createdAt: Date;
            updatedAt: Date;
            doctor: {
                id: string;
                name: string;
                email: string | null;
                phone: string | null;
                role: Role;
                doctorProfile: {
                    degree: string;
                    qualification: string;
                    clinicalExperienceYears: number;
                    bio: string;
                    photoUrl: string | null;
                    branchName: any;
                    profileLink: any;
                    expertiseTags: string[] | null;
                    profileCompleted: any;
                } | null;
            } | null;
        }[];
    }>;
    answer(user: JwtPayload, id: string, dto: CreateAnswerDto): Promise<import("../entities/answer.entity").Answer>;
    uploadImage(file: Express.Multer.File): {
        url: string;
    };
    updateAnswerPlaceholder(id: string, dto: CreateAnswerDto): {
        id: string;
        answerText: string;
        updated: boolean;
    };
}

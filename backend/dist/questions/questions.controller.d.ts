import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { QuestionStatus } from '../common/enums/question-status.enum';
import { Role } from '../common/enums/role.enum';
import { CreateFollowupDto } from './dto/create-followup.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionsService } from './questions.service';
export declare class QuestionsController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    createQuestion(user: JwtPayload, dto: CreateQuestionDto): Promise<import("../entities/question.entity").Question>;
    myQuestions(user: JwtPayload, page?: string, limit?: string): Promise<import("../entities/question.entity").Question[]>;
    thread(user: JwtPayload, id: string): Promise<{
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
                    branchName: string | null;
                    profileLink: string | null;
                    expertiseTags: string[] | null;
                    profileCompleted: boolean;
                } | null;
            } | null;
        }[];
    }>;
    followup(user: JwtPayload, id: string, dto: CreateFollowupDto): Promise<import("../entities/question-followup.entity").QuestionFollowup>;
    statuses(): QuestionStatus[];
}

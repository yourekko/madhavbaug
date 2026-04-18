import type { Request } from 'express';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { QuestionStatus } from '../common/enums/question-status.enum';
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
    detail(user: JwtPayload, id: string): Promise<import("../entities/question.entity").Question>;
    answer(user: JwtPayload, id: string, dto: CreateAnswerDto): Promise<import("../entities/answer.entity").Answer>;
    uploadImage(file: Express.Multer.File, req: Request): {
        url: string;
    };
    updateAnswerPlaceholder(id: string, dto: CreateAnswerDto): {
        id: string;
        answerText: string;
        updated: boolean;
    };
}

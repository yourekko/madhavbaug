import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { QuestionStatus } from '../common/enums/question-status.enum';
import { CreateFollowupDto } from './dto/create-followup.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionsService } from './questions.service';
export declare class QuestionsController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    createQuestion(user: JwtPayload, dto: CreateQuestionDto): Promise<import("../entities/question.entity").Question>;
    myQuestions(user: JwtPayload, page?: string, limit?: string): Promise<import("../entities/question.entity").Question[]>;
    thread(user: JwtPayload, id: string): Promise<import("../entities/question.entity").Question>;
    followup(user: JwtPayload, id: string, dto: CreateFollowupDto): Promise<import("../entities/question-followup.entity").QuestionFollowup>;
    statuses(): QuestionStatus[];
}

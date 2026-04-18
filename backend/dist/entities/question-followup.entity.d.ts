import { Question } from './question.entity';
import { User } from './user.entity';
export declare class QuestionFollowup {
    id: string;
    questionId: string;
    question: Question;
    patientUserId: string;
    patientUser: User;
    message: string;
    optionalContactName: string | null;
    optionalContactPhone: string | null;
    createdAt: Date;
}

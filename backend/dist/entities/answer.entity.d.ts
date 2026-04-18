import { Question } from './question.entity';
import { User } from './user.entity';
export declare class Answer {
    id: string;
    questionId: string;
    question: Question;
    doctorUserId: string;
    doctor: User;
    answerText: string;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}

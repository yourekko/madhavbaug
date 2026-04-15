import { Question } from './question.entity';
import { User } from './user.entity';
export declare class QuestionAssignment {
    id: string;
    questionId: string;
    question: Question;
    doctorUserId: string;
    doctor: User;
    assignedBy: string | null;
    assignedAt: Date;
}

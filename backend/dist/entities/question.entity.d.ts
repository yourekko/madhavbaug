import { QuestionStatus } from '../common/enums/question-status.enum';
import { Answer } from './answer.entity';
import { QuestionAssignment } from './question-assignment.entity';
import { QuestionFollowup } from './question-followup.entity';
import { User } from './user.entity';
export declare class Question {
    id: string;
    patientUserId: string;
    patientUser: User;
    title: string;
    body: string;
    category: string;
    patientAgeGroup: string | null;
    patientGender: string | null;
    patientHistory: string | null;
    forumSlug: string | null;
    viewCount: number;
    status: QuestionStatus;
    assignments?: QuestionAssignment[];
    answers?: Answer[];
    followups?: QuestionFollowup[];
    createdAt: Date;
    updatedAt: Date;
}

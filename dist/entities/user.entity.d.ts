import { Role } from '../common/enums/role.enum';
import { Answer } from './answer.entity';
import { AuditLog } from './audit-log.entity';
import { DoctorProfile } from './doctor-profile.entity';
import { Question } from './question.entity';
import { QuestionAssignment } from './question-assignment.entity';
import { QuestionFollowup } from './question-followup.entity';
export declare class User {
    id: string;
    role: Role;
    name: string;
    email: string | null;
    phone: string | null;
    passwordHash: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    doctorProfile?: DoctorProfile;
    patientQuestions?: Question[];
    assignments?: QuestionAssignment[];
    answers?: Answer[];
    followups?: QuestionFollowup[];
    auditLogs?: AuditLog[];
}

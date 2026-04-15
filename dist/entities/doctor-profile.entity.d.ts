import { User } from './user.entity';
export declare class DoctorProfile {
    id: string;
    userId: string;
    user: User;
    degree: string;
    qualification: string;
    clinicalExperienceYears: number;
    bio: string;
    photoUrl: string | null;
    expertiseTags: string[] | null;
}

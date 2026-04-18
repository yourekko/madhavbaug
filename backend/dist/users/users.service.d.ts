import { Repository } from 'typeorm';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { User } from '../entities/user.entity';
type CreateUserInput = {
    name: string;
    email: string | null;
    phone: string | null;
    role: User['role'];
    passwordHash: string;
    googleSub?: string | null;
};
type CreateDoctorProfileInput = {
    userId: string;
    degree: string;
    qualification: string;
    clinicalExperienceYears: number;
    photoUrl: string | null;
    bio: string;
    branchName: string | null;
    profileLink: string | null;
    whatsappNumber: string | null;
    expertiseTags: string[];
    profileCompleted?: boolean;
};
export declare class UsersService {
    private readonly usersRepo;
    private readonly profileRepo;
    constructor(usersRepo: Repository<User>, profileRepo: Repository<DoctorProfile>);
    findByEmailOrPhone(email: string | null, phone: string | null): Promise<User | null> | null;
    findByGoogleSub(googleSub: string): Promise<User | null>;
    setGoogleSub(userId: string, googleSub: string): Promise<User>;
    createUser(input: CreateUserInput): Promise<User>;
    createDoctorProfile(input: CreateDoctorProfileInput): Promise<DoctorProfile>;
    updatePatientPhone(userId: string, phone: string, name?: string): Promise<User>;
    completeDoctorProfile(userId: string, input: {
        degree: string;
        qualification: string;
        clinicalExperienceYears: number;
        photoUrl: string | null;
        bio: string;
        branchName: string;
        profileLink: string;
        whatsappNumber: string;
        expertiseTags: string[];
    }): Promise<void>;
    updateDoctorWhatsappPhone(userId: string, whatsappNumber: string): Promise<User>;
    getById(id: string): Promise<User>;
    getDoctorProfileByUserId(userId: string): Promise<DoctorProfile | null>;
    getDoctors(): Promise<User[]>;
}
export {};

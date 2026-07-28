import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { AuditLog } from '../entities/audit-log.entity';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { User } from '../entities/user.entity';
type CreateUserInput = {
    name: string;
    email: string | null;
    phone: string | null;
    role: User['role'];
    passwordHash: string;
    googleSub?: string | null;
    signupLocation?: string | null;
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
    private readonly auditRepo;
    constructor(usersRepo: Repository<User>, profileRepo: Repository<DoctorProfile>, auditRepo: Repository<AuditLog>);
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
    adminSetUserActive(adminUserId: string, targetUserId: string, isActive: boolean): Promise<{
        ok: boolean;
        userId: string;
        role: Role.PATIENT | Role.DOCTOR;
        isActive: boolean;
    }>;
}
export {};

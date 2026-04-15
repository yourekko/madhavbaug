import { Repository } from 'typeorm';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { User } from '../entities/user.entity';
type CreateUserInput = {
    name: string;
    email: string | null;
    phone: string | null;
    role: User['role'];
    passwordHash: string;
};
type CreateDoctorProfileInput = {
    userId: string;
    degree: string;
    qualification: string;
    clinicalExperienceYears: number;
    photoUrl: string | null;
    bio: string;
    expertiseTags: string[];
};
export declare class UsersService {
    private readonly usersRepo;
    private readonly profileRepo;
    constructor(usersRepo: Repository<User>, profileRepo: Repository<DoctorProfile>);
    findByEmailOrPhone(email: string | null, phone: string | null): Promise<User | null> | null;
    createUser(input: CreateUserInput): Promise<User>;
    createDoctorProfile(input: CreateDoctorProfileInput): Promise<DoctorProfile>;
    getById(id: string): Promise<User>;
    getDoctorProfileByUserId(userId: string): Promise<DoctorProfile | null>;
    getDoctors(): Promise<User[]>;
}
export {};

import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { AuditLog } from '../entities/audit-log.entity';
import { UsersService } from '../users/users.service';
import { DoctorSignupDto } from './dto/doctor-signup.dto';
import { LoginDto } from './dto/login.dto';
import { PatientSignupDto } from './dto/patient-signup.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly auditRepo;
    constructor(usersService: UsersService, jwtService: JwtService, auditRepo: Repository<AuditLog>);
    signupPatient(input: PatientSignupDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            role: Role;
            email: string | null;
            phone: string | null;
        };
    }>;
    signupDoctor(input: DoctorSignupDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            role: Role;
            email: string | null;
            phone: string | null;
        };
    }>;
    login(input: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            role: Role;
            email: string | null;
            phone: string | null;
        };
    }>;
    private recordAuthAudit;
    private buildAuthResponse;
    getMe(userId: string): Promise<{
        id: string;
        name: string;
        role: Role;
        email: string | null;
        phone: string | null;
        doctorProfile: {
            degree: string;
            qualification: string;
            clinicalExperienceYears: number;
            bio: string;
            photoUrl: string | null;
            expertiseTags: string[];
        } | null;
    }>;
}

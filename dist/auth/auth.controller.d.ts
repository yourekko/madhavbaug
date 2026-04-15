import type { Request } from 'express';
import { AuthService } from './auth.service';
import { DoctorSignupDto } from './dto/doctor-signup.dto';
import { LoginDto } from './dto/login.dto';
import { PatientSignupDto } from './dto/patient-signup.dto';
import type { JwtPayload } from './types/jwt-payload.type';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(dto: PatientSignupDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            role: import("../common/enums/role.enum").Role;
            email: string | null;
            phone: string | null;
        };
    }>;
    signupDoctor(dto: DoctorSignupDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            role: import("../common/enums/role.enum").Role;
            email: string | null;
            phone: string | null;
        };
    }>;
    uploadDoctorPhoto(file: Express.Multer.File, req: Request): {
        url: string;
    };
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            role: import("../common/enums/role.enum").Role;
            email: string | null;
            phone: string | null;
        };
    }>;
    me(user: JwtPayload): Promise<{
        id: string;
        name: string;
        role: import("../common/enums/role.enum").Role;
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

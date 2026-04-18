import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthService } from './auth.service';
import { CompleteDoctorProfileDto } from './dto/complete-doctor-profile.dto';
import { CompletePatientPhoneDto } from './dto/complete-patient-phone.dto';
import { DoctorSignupDto } from './dto/doctor-signup.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import { PatientSignupDto } from './dto/patient-signup.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { JwtPayload } from './types/jwt-payload.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: PatientSignupDto) {
    return this.authService.signupPatient(dto);
  }

  @Post('doctor/signup')
  signupDoctor(@Body() dto: DoctorSignupDto) {
    return this.authService.signupDoctor(dto);
  }

  @Post('google')
  google(@Body() dto: GoogleAuthDto) {
    return this.authService.loginWithGoogle(dto.idToken, dto.role);
  }

  @Patch('patient/phone')
  @UseGuards(JwtAuthGuard)
  completePatientPhone(@CurrentUser() user: JwtPayload, @Body() dto: CompletePatientPhoneDto) {
    return this.authService.completePatientPhone(user.sub, dto.phone, dto.name);
  }

  @Patch('doctor/complete-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  completeDoctorProfile(@CurrentUser() user: JwtPayload, @Body() dto: CompleteDoctorProfileDto) {
    return this.authService.completeDoctorProfile(user.sub, dto);
  }

  @Post('doctor/upload-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          const safe = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
          cb(null, `${randomUUID()}${safe}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!/^image\/(jpeg|pjpeg|png|gif|webp)$/i.test(file.mimetype)) {
          return cb(new BadRequestException('Only JPEG, PNG, GIF, or WebP images are allowed.'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadDoctorPhoto(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('No image file received.');
    const host = req.get('host');
    const proto = req.protocol;
    return { url: `${proto}://${host}/uploads/${file.filename}` };
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }
}

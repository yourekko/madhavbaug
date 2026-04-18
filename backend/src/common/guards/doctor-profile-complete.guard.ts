import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { Role } from '../enums/role.enum';
import { UsersService } from '../../users/users.service';

@Injectable()
export class DoctorProfileCompleteGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const jwt = req.user;
    if (!jwt || jwt.role !== Role.DOCTOR) return true;
    const profile = await this.usersService.getDoctorProfileByUserId(jwt.sub);
    if (profile && profile.profileCompleted === false) {
      throw new ForbiddenException('Complete your doctor profile at /forum/doctor/complete-profile before using this area.');
    }
    return true;
  }
}

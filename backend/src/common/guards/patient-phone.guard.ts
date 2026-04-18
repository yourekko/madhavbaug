import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { Role } from '../enums/role.enum';
import { UsersService } from '../../users/users.service';

@Injectable()
export class PatientPhoneGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const jwt = req.user;
    if (!jwt || jwt.role !== Role.PATIENT) return true;
    const user = await this.usersService.getById(jwt.sub);
    if (!user.phone) {
      throw new ForbiddenException('Add your phone number before continuing. Open /forum/complete-phone.');
    }
    return true;
  }
}

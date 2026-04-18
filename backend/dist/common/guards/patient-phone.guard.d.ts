import { CanActivate, ExecutionContext } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
export declare class PatientPhoneGuard implements CanActivate {
    private readonly usersService;
    constructor(usersService: UsersService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}

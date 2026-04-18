import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const email = this.configService.get<string>('DEFAULT_ADMIN_EMAIL', 'admin@madhavbaug.local');
    const existing = await this.usersService.findByEmailOrPhone(email, null);
    if (existing) return;
    const password = this.configService.get<string>('DEFAULT_ADMIN_PASSWORD', 'Admin@12345');
    const passwordHash = await bcrypt.hash(password, 10);
    await this.usersService.createUser({
      name: 'Platform Admin',
      email,
      phone: null,
      role: Role.ADMIN,
      passwordHash,
    });
    this.logger.log(`Default admin seeded: ${email}`);
  }
}

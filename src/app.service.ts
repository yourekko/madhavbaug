import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: 'madhavbaug-backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

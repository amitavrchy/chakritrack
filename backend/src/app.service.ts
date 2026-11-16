import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo(): { name: string; version: string; docs: string } {
    return { name: 'ChakriTrack API', version: '0.1.0', docs: '/api/v1/health' };
  }
}

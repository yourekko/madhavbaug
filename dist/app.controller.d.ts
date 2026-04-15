import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): {
        service: string;
        status: string;
        timestamp: string;
    };
    health(): {
        service: string;
        status: string;
        timestamp: string;
    };
}

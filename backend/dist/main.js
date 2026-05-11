"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const fs_1 = require("fs");
const path_1 = require("path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const uploadsRoot = (0, path_1.join)(process.cwd(), 'uploads');
    if (!(0, fs_1.existsSync)(uploadsRoot))
        (0, fs_1.mkdirSync)(uploadsRoot, { recursive: true });
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useStaticAssets(uploadsRoot, { prefix: '/uploads/' });
    app.enableCors({
        origin: true,
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Forum-Viewer-Id'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map
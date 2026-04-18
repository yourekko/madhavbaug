"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const answer_entity_1 = require("./entities/answer.entity");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const doctor_profile_entity_1 = require("./entities/doctor-profile.entity");
const question_assignment_entity_1 = require("./entities/question-assignment.entity");
const question_followup_entity_1 = require("./entities/question-followup.entity");
const question_entity_1 = require("./entities/question.entity");
const seo_page_entity_1 = require("./entities/seo-page.entity");
const user_entity_1 = require("./entities/user.entity");
const questions_module_1 = require("./questions/questions.module");
const seed_service_1 = require("./seed/seed.service");
const seo_module_1 = require("./seo/seo.module");
const users_module_1 = require("./users/users.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'mysql',
                    host: config.get('DB_HOST', '127.0.0.1'),
                    port: Number(config.get('DB_PORT', '3306')),
                    username: config.get('DB_USER', 'root'),
                    password: config.get('DB_PASSWORD', ''),
                    database: config.get('DB_NAME', 'madhavbaug'),
                    entities: [user_entity_1.User, doctor_profile_entity_1.DoctorProfile, question_entity_1.Question, question_assignment_entity_1.QuestionAssignment, answer_entity_1.Answer, question_followup_entity_1.QuestionFollowup, seo_page_entity_1.SeoPage, audit_log_entity_1.AuditLog],
                    synchronize: config.get('DB_SYNC', 'true') === 'true',
                }),
            }),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            questions_module_1.QuestionsModule,
            seo_module_1.SeoModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, seed_service_1.SeedService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
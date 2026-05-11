"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const typeorm_1 = require("typeorm");
const answer_entity_1 = require("./entities/answer.entity");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const doctor_profile_entity_1 = require("./entities/doctor-profile.entity");
const question_assignment_entity_1 = require("./entities/question-assignment.entity");
const question_followup_entity_1 = require("./entities/question-followup.entity");
const forum_question_view_dedupe_entity_1 = require("./entities/forum-question-view-dedupe.entity");
const question_entity_1 = require("./entities/question.entity");
const seo_page_entity_1 = require("./entities/seo-page.entity");
const user_entity_1 = require("./entities/user.entity");
exports.default = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'madhavbaug',
    entities: [
        user_entity_1.User,
        doctor_profile_entity_1.DoctorProfile,
        question_entity_1.Question,
        question_assignment_entity_1.QuestionAssignment,
        answer_entity_1.Answer,
        question_followup_entity_1.QuestionFollowup,
        seo_page_entity_1.SeoPage,
        audit_log_entity_1.AuditLog,
        forum_question_view_dedupe_entity_1.ForumQuestionViewDedupe,
    ],
    migrations: ['dist/migrations/*.js'],
});
//# sourceMappingURL=data-source.js.map
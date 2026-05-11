"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForumQuestionViewDedupe1746720000000 = void 0;
class ForumQuestionViewDedupe1746720000000 {
    name = 'ForumQuestionViewDedupe1746720000000';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`forum_question_view_dedupe\` (
        \`id\` char(36) NOT NULL,
        \`question_id\` char(36) NOT NULL,
        \`viewer_key\` varchar(256) NOT NULL,
        \`last_counted_at\` datetime NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_forum_question_view_dedupe_q_v\` (\`question_id\`, \`viewer_key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE IF EXISTS `forum_question_view_dedupe`');
    }
}
exports.ForumQuestionViewDedupe1746720000000 = ForumQuestionViewDedupe1746720000000;
//# sourceMappingURL=1746720000000-ForumQuestionViewDedupe.js.map
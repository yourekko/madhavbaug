import { MigrationInterface, QueryRunner } from 'typeorm';

export class ForumQuestionViewDedupe1746720000000 implements MigrationInterface {
  name = 'ForumQuestionViewDedupe1746720000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `forum_question_view_dedupe`');
  }
}

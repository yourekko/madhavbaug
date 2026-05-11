import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class ForumQuestionViewDedupe1746720000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}

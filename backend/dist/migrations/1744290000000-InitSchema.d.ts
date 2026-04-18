import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class InitSchema1744290000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(_: QueryRunner): Promise<void>;
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1744290000000 implements MigrationInterface {
  name = 'InitSchema1744290000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  public async down(_: QueryRunner): Promise<void> {
    // This initial migration is a marker for schema bootstrap.
  }
}

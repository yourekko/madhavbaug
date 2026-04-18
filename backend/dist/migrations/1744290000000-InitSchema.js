"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitSchema1744290000000 = void 0;
class InitSchema1744290000000 {
    name = 'InitSchema1744290000000';
    async up(queryRunner) {
        await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
        await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
    }
    async down(_) {
    }
}
exports.InitSchema1744290000000 = InitSchema1744290000000;
//# sourceMappingURL=1744290000000-InitSchema.js.map
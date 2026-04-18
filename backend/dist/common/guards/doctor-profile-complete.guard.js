"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorProfileCompleteGuard = void 0;
const common_1 = require("@nestjs/common");
const role_enum_1 = require("../enums/role.enum");
const users_service_1 = require("../../users/users.service");
let DoctorProfileCompleteGuard = class DoctorProfileCompleteGuard {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const jwt = req.user;
        if (!jwt || jwt.role !== role_enum_1.Role.DOCTOR)
            return true;
        const profile = await this.usersService.getDoctorProfileByUserId(jwt.sub);
        if (profile && profile.profileCompleted === false) {
            throw new common_1.ForbiddenException('Complete your doctor profile at /forum/doctor/complete-profile before using this area.');
        }
        return true;
    }
};
exports.DoctorProfileCompleteGuard = DoctorProfileCompleteGuard;
exports.DoctorProfileCompleteGuard = DoctorProfileCompleteGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], DoctorProfileCompleteGuard);
//# sourceMappingURL=doctor-profile-complete.guard.js.map
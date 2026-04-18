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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_enum_1 = require("../common/enums/role.enum");
const doctor_profile_entity_1 = require("../entities/doctor-profile.entity");
const user_entity_1 = require("../entities/user.entity");
let UsersService = class UsersService {
    usersRepo;
    profileRepo;
    constructor(usersRepo, profileRepo) {
        this.usersRepo = usersRepo;
        this.profileRepo = profileRepo;
    }
    findByEmailOrPhone(email, phone) {
        if (email && phone) {
            return this.usersRepo.findOne({ where: [{ email }, { phone }] });
        }
        if (email)
            return this.usersRepo.findOne({ where: { email } });
        if (phone)
            return this.usersRepo.findOne({ where: { phone } });
        return null;
    }
    findByGoogleSub(googleSub) {
        return this.usersRepo.findOne({ where: { googleSub } });
    }
    async setGoogleSub(userId, googleSub) {
        await this.usersRepo.update({ id: userId }, { googleSub });
        return this.getById(userId);
    }
    createUser(input) {
        const user = this.usersRepo.create(input);
        return this.usersRepo.save(user);
    }
    createDoctorProfile(input) {
        const profile = this.profileRepo.create({
            ...input,
            profileCompleted: input.profileCompleted ?? true,
        });
        return this.profileRepo.save(profile);
    }
    async updatePatientPhone(userId, phone, name) {
        const normalized = phone.trim();
        const other = await this.usersRepo.findOne({ where: { phone: normalized } });
        if (other && other.id !== userId) {
            throw new common_1.ConflictException('That phone number is already registered.');
        }
        await this.usersRepo.update({ id: userId }, { phone: normalized, ...(name?.trim() ? { name: name.trim() } : {}) });
        return this.getById(userId);
    }
    async completeDoctorProfile(userId, input) {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Doctor profile not found.');
        profile.degree = input.degree;
        profile.qualification = input.qualification;
        profile.clinicalExperienceYears = input.clinicalExperienceYears;
        profile.photoUrl = input.photoUrl;
        profile.bio = input.bio;
        profile.branchName = input.branchName;
        profile.profileLink = input.profileLink;
        profile.whatsappNumber = input.whatsappNumber;
        profile.expertiseTags = input.expertiseTags;
        profile.profileCompleted = true;
        await this.profileRepo.save(profile);
    }
    async updateDoctorWhatsappPhone(userId, whatsappNumber) {
        const normalized = whatsappNumber.trim();
        const other = await this.usersRepo.findOne({ where: { phone: normalized } });
        if (other && other.id !== userId) {
            throw new common_1.ConflictException('That WhatsApp number is already registered.');
        }
        await this.usersRepo.update({ id: userId }, { phone: normalized });
        return this.getById(userId);
    }
    async getById(id) {
        const user = await this.usersRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found.');
        return user;
    }
    getDoctorProfileByUserId(userId) {
        return this.profileRepo.findOne({ where: { userId } });
    }
    getDoctors() {
        return this.usersRepo.find({
            where: { role: role_enum_1.Role.DOCTOR },
            order: { createdAt: 'DESC' },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(doctor_profile_entity_1.DoctorProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map
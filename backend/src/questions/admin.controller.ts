import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { QuestionStatus } from '../common/enums/question-status.enum';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersService } from '../users/users.service';
import { AssignDoctorDto } from './dto/assign-doctor.dto';
import { UpdateQuestionStatusDto } from './dto/update-question-status.dto';
import { QuestionsService } from './questions.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AdminController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.questionsService.adminDashboard();
  }

  @Get('questions')
  questions(@Query('status') status?: QuestionStatus, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.questionsService.adminListQuestions(status, Number(page ?? 1), Number(limit ?? 20));
  }

  @Patch('questions/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateQuestionStatusDto, @CurrentUser() user: JwtPayload) {
    return this.questionsService.adminUpdateStatus(id, dto.status, user.sub);
  }

  @Post('questions/:id/assign-doctor')
  assignDoctor(@Param('id') id: string, @Body() dto: AssignDoctorDto, @CurrentUser() user: JwtPayload) {
    return this.questionsService.adminAssignDoctor(id, dto.doctorUserId, user.sub);
  }

  @Get('doctors')
  doctors() {
    return this.usersService.getDoctors();
  }

  @Get('reports/doctors')
  doctorReports() {
    return this.questionsService.adminDoctorAnalytics();
  }

  @Get('reports/doctors/:doctorUserId')
  doctorDetail(@Param('doctorUserId') doctorUserId: string) {
    return this.questionsService.adminDoctorAnalyticsDetail(doctorUserId);
  }

  @Get('reports/patients')
  patientReports() {
    return this.questionsService.adminPatientAnalytics();
  }
}

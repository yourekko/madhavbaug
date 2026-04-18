import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { QuestionStatus } from '../common/enums/question-status.enum';
import { Role } from '../common/enums/role.enum';
import { PatientPhoneGuard } from '../common/guards/patient-phone.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateFollowupDto } from './dto/create-followup.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionsService } from './questions.service';

@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseGuards(PatientPhoneGuard)
  @Roles(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPERADMIN)
  createQuestion(@CurrentUser() user: JwtPayload, @Body() dto: CreateQuestionDto) {
    return this.questionsService.createQuestion(user.sub, dto);
  }

  @Get('my')
  @Roles(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPERADMIN)
  myQuestions(@CurrentUser() user: JwtPayload, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.questionsService.getMyQuestions(user.sub, Number(page ?? 1), Number(limit ?? 20));
  }

  @Get(':id')
  thread(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.questionsService.getQuestionThread(id, user.sub, user.role);
  }

  @Post(':id/followups')
  @UseGuards(PatientPhoneGuard)
  @Roles(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPERADMIN)
  followup(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CreateFollowupDto) {
    return this.questionsService.addFollowup(id, user.sub, dto);
  }

  @Get('status/open')
  @Roles(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPERADMIN)
  statuses() {
    return Object.values(QuestionStatus);
  }
}

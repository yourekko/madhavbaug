import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { QuestionStatus } from '../common/enums/question-status.enum';
import { Role } from '../common/enums/role.enum';
import { DoctorProfileCompleteGuard } from '../common/guards/doctor-profile-complete.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { QuestionsService } from './questions.service';

@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard, DoctorProfileCompleteGuard)
@Roles(Role.DOCTOR)
export class DoctorController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('questions')
  list(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: QuestionStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.questionsService.listDoctorQuestions(user.sub, status, Number(page ?? 1), Number(limit ?? 20));
  }

  @Get('questions/:id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.questionsService.getQuestionThread(id, user.sub, user.role);
  }

  @Post('questions/:id/answers')
  answer(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CreateAnswerDto) {
    return this.questionsService.addDoctorAnswer(user.sub, id, dto);
  }

  @Post('uploads/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          const safe = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
          cb(null, `${randomUUID()}${safe}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!/^image\/(jpeg|pjpeg|png|gif|webp)$/i.test(file.mimetype)) {
          return cb(new BadRequestException('Only JPEG, PNG, GIF, or WebP images are allowed.'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('No image file received.');
    const host = req.get('host');
    const proto = req.protocol;
    return { url: `${proto}://${host}/uploads/${file.filename}` };
  }

  @Patch('answers/:id')
  updateAnswerPlaceholder(@Param('id') id: string, @Body() dto: CreateAnswerDto) {
    return { id, answerText: dto.answerText, updated: true };
  }
}

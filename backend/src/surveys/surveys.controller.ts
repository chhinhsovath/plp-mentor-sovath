import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Response,
  UploadedFiles,
  UseInterceptors,
  ParseUUIDPipe,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SurveysService } from './surveys.service';
import { SurveyResponsesService } from './survey-responses.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { SubmitResponseDto, SaveDraftResponseDto } from './dto/submit-response.dto';
import { SurveyFilterDto } from './dto/survey-filter.dto';
import { UserRole } from '../entities';

const multerOptions = {
  storage: diskStorage({
    destination: './uploads/surveys',
    filename: (req, file, callback) => {
      const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
      const ext = extname(file.originalname);
      callback(null, `${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    // Accept images, audio, video, and documents
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Invalid file type'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
};

@ApiTags('Surveys')
@Controller('surveys')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SurveysController {
  constructor(
    private readonly surveysService: SurveysService,
    private readonly responsesService: SurveyResponsesService,
  ) {}

  @Post()
  @Roles(UserRole.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new survey' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Survey created successfully' })
  async create(
    @Body() createSurveyDto: CreateSurveyDto,
    @CurrentUser() user: any,
  ) {
    return this.surveysService.create(createSurveyDto, user.id);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all surveys' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of surveys' })
  async findAll(@Query() filterDto: SurveyFilterDto) {
    return this.surveysService.findAll(filterDto);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get survey by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Survey details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Survey not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.surveysService.findOne(id);
  }

  @Get('public/:slug')
  @Public()
  @ApiOperation({ summary: 'Get published survey by slug (public)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Survey details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Survey not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.surveysService.findBySlug(slug);
  }

  @Patch(':id')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update survey' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Survey updated successfully' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSurveyDto: UpdateSurveyDto,
  ) {
    return this.surveysService.update(id, updateSurveyDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete survey' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Survey deleted successfully' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.surveysService.remove(id);
  }

  @Get(':id/statistics')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get survey statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Survey statistics' })
  async getStatistics(@Param('id', ParseUUIDPipe) id: string) {
    return this.surveysService.getSurveyStatistics(id);
  }

  @Post(':id/responses')
  @Public()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'files', maxCount: 10 },
  ], multerOptions))
  @ApiOperation({ summary: 'Submit survey response' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Response submitted successfully' })
  async submitResponse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() submitDto: SubmitResponseDto,
    @UploadedFiles() files: { files?: any[] },
    @Request() req: any,
  ) {
    // Process file uploads if any
    if (files?.files) {
      const fileMap = new Map<string, any[]>();
      
      files.files.forEach((file) => {
        const questionId = file.fieldname.split('_')[1]; // Expecting format: file_questionId_index
        if (!fileMap.has(questionId)) {
          fileMap.set(questionId, []);
        }
        
        fileMap.get(questionId).push({
          originalName: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
        });
      });

      // Update answers with file information
      submitDto.answers.forEach((answer) => {
        if (fileMap.has(answer.questionId)) {
          answer.files = fileMap.get(answer.questionId);
        }
      });
    }

    const userId = req.user?.id;
    return this.responsesService.submitResponse(id, submitDto, userId);
  }

  @Post(':id/responses/draft')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'files', maxCount: 10 },
  ], multerOptions))
  @ApiOperation({ summary: 'Save draft response' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Draft saved successfully' })
  async saveDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() draftDto: SaveDraftResponseDto,
    @UploadedFiles() files: { files?: any[] },
    @Request() req: any,
  ) {
    // Process file uploads similar to submitResponse
    if (files?.files) {
      const fileMap = new Map<string, any[]>();
      
      files.files.forEach((file) => {
        const questionId = file.fieldname.split('_')[1];
        if (!fileMap.has(questionId)) {
          fileMap.set(questionId, []);
        }
        
        fileMap.get(questionId).push({
          originalName: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
        });
      });

      draftDto.answers.forEach((answer) => {
        if (fileMap.has(answer.questionId)) {
          answer.files = fileMap.get(answer.questionId);
        }
      });
    }

    const userId = req.user?.id;
    return this.responsesService.saveDraft(id, draftDto, userId);
  }

  @Get(':id/export')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export survey responses' })
  @ApiQuery({ name: 'format', enum: ['csv', 'json'], required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Export data' })
  async exportResponses(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('format') format: 'csv' | 'json' = 'csv',
    @Response() res: any,
  ) {
    const data = await this.responsesService.exportResponses(id, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=survey-responses.csv');
      res.send(data);
    } else {
      res.json(data);
    }
  }

  @Get('responses/:uuid')
  @Public()
  @ApiOperation({ summary: 'Get response by UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Response details' })
  async getResponse(@Param('uuid') uuid: string) {
    return this.responsesService.findResponseByUuid(uuid);
  }
}
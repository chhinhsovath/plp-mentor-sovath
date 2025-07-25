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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ObservationFormsService } from './observation-forms.service';
import { LessonPhasesService } from './lesson-phases.service';
import { IndicatorsService } from './indicators.service';
import { FormTemplateService } from './form-template.service';
import { CreateObservationFormDto } from './dto/create-observation-form.dto';
import { UpdateObservationFormDto } from './dto/update-observation-form.dto';
import { FormFilterDto } from './dto/form-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../entities/user.entity';

@ApiTags('Observation Forms')
@Controller('observation-forms')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ObservationFormsController {
  constructor(
    private readonly observationFormsService: ObservationFormsService,
    private readonly lessonPhasesService: LessonPhasesService,
    private readonly indicatorsService: IndicatorsService,
    private readonly formTemplateService: FormTemplateService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new observation form template' })
  @ApiResponse({
    status: 201,
    description: 'Observation form created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Form code already exists',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async create(@Body() createObservationFormDto: CreateObservationFormDto) {
    return this.observationFormsService.create(createObservationFormDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all observation forms with optional filtering' })
  @ApiQuery({ name: 'subject', required: false, description: 'Filter by subject' })
  @ApiQuery({ name: 'grade', required: false, description: 'Filter by grade' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by form code or title' })
  @ApiResponse({
    status: 200,
    description: 'Observation forms retrieved successfully',
  })
  async findAll(@Query() filterDto: FormFilterDto) {
    return this.observationFormsService.findAll(filterDto);
  }

  @Get('subjects')
  @ApiOperation({ summary: 'Get all available subjects' })
  @ApiResponse({
    status: 200,
    description: 'Available subjects retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  async getAvailableSubjects() {
    return this.observationFormsService.getAvailableSubjects();
  }

  @Get('grades')
  @ApiOperation({ summary: 'Get all available grades' })
  @ApiResponse({
    status: 200,
    description: 'Available grades retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  async getAvailableGrades() {
    return this.observationFormsService.getAvailableGrades();
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all available form templates' })
  @ApiResponse({
    status: 200,
    description: 'Form templates retrieved successfully',
  })
  async getFormTemplates() {
    return this.formTemplateService.getAllTemplates();
  }

  @Get('templates/by-grade')
  @ApiOperation({ summary: 'Get form templates by grade and optional subject' })
  @ApiQuery({ name: 'grade', required: true, description: 'Grade level' })
  @ApiQuery({ name: 'subject', required: false, description: 'Subject (optional)' })
  @ApiResponse({
    status: 200,
    description: 'Form templates retrieved successfully',
  })
  async getFormTemplatesByGrade(
    @Query('grade') grade: string,
    @Query('subject') subject?: string,
  ) {
    return this.formTemplateService.getAvailableTemplates(grade, subject);
  }

  @Get('by-grade-subject')
  @ApiOperation({ summary: 'Get forms by grade and subject' })
  @ApiQuery({ name: 'grade', required: true, description: 'Grade to filter by' })
  @ApiQuery({ name: 'subject', required: true, description: 'Subject to filter by' })
  @ApiResponse({
    status: 200,
    description: 'Forms retrieved successfully',
  })
  async getFormsByGradeAndSubject(
    @Query('grade') grade: string,
    @Query('subject') subject: string,
  ) {
    return this.observationFormsService.getFormsByGradeAndSubject(grade, subject);
  }

  @Get('code/:formCode')
  @ApiOperation({ summary: 'Get observation form by form code' })
  @ApiParam({
    name: 'formCode',
    description: 'Form code (e.g., G1-KH)',
  })
  @ApiResponse({
    status: 200,
    description: 'Observation form retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Form not found',
  })
  async findByCode(@Param('formCode') formCode: string) {
    return this.observationFormsService.findByCode(formCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get observation form by ID' })
  @ApiParam({
    name: 'id',
    description: 'Form ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Observation form retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Form not found',
  })
  async findOne(@Param('id') id: string) {
    return this.observationFormsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update observation form' })
  @ApiParam({
    name: 'id',
    description: 'Form ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Observation form updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Form not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Form code already exists',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async update(
    @Param('id') id: string,
    @Body() updateObservationFormDto: UpdateObservationFormDto,
  ) {
    return this.observationFormsService.update(id, updateObservationFormDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete observation form' })
  @ApiParam({
    name: 'id',
    description: 'Form ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Observation form deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Form not found',
  })
  @Roles(UserRole.ADMINISTRATOR)
  async remove(@Param('id') id: string) {
    await this.observationFormsService.remove(id);
  }

  // Lesson Phases endpoints
  @Get(':id/phases')
  @ApiOperation({ summary: 'Get lesson phases for a form' })
  @ApiParam({
    name: 'id',
    description: 'Form ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson phases retrieved successfully',
  })
  async getFormPhases(@Param('id') formId: string) {
    return this.lessonPhasesService.findByFormId(formId);
  }

  @Patch(':id/phases/order')
  @ApiOperation({ summary: 'Update lesson phase order' })
  @ApiParam({
    name: 'id',
    description: 'Form ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Phase order updated successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async updatePhaseOrder(
    @Param('id') formId: string,
    @Body() phaseOrders: { id: string; sectionOrder: number }[],
  ) {
    await this.lessonPhasesService.updatePhaseOrder(formId, phaseOrders);
    return { message: 'Phase order updated successfully' };
  }

  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate form structure' })
  @ApiParam({
    name: 'id',
    description: 'Form ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Form validation completed',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async validateForm(@Param('id') formId: string) {
    return this.lessonPhasesService.validatePhaseStructure(formId);
  }

  // Indicators endpoints
  @Get('indicators/:id')
  @ApiOperation({ summary: 'Get indicator by ID' })
  @ApiParam({
    name: 'id',
    description: 'Indicator ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Indicator retrieved successfully',
  })
  async getIndicator(@Param('id') id: string) {
    return this.indicatorsService.findOne(id);
  }

  @Patch('indicators/:id/activate')
  @ApiOperation({ summary: 'Activate indicator' })
  @ApiParam({
    name: 'id',
    description: 'Indicator ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Indicator activated successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async activateIndicator(@Param('id') id: string) {
    await this.indicatorsService.activate(id);
    return { message: 'Indicator activated successfully' };
  }

  @Patch('indicators/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate indicator' })
  @ApiParam({
    name: 'id',
    description: 'Indicator ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Indicator deactivated successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async deactivateIndicator(@Param('id') id: string) {
    await this.indicatorsService.deactivate(id);
    return { message: 'Indicator deactivated successfully' };
  }

  @Get('indicators/:id/validate')
  @ApiOperation({ summary: 'Validate indicator structure' })
  @ApiParam({
    name: 'id',
    description: 'Indicator ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Indicator validation completed',
  })
  async validateIndicator(@Param('id') id: string) {
    return this.indicatorsService.validateIndicatorStructure(id);
  }

  // Dynamic form template endpoints
  @Get('templates/filtered')
  @ApiOperation({ summary: 'Get available form templates by grade and subject' })
  @ApiQuery({ name: 'grade', required: true, description: 'Grade level' })
  @ApiQuery({ name: 'subject', required: false, description: 'Subject (optional)' })
  @ApiResponse({
    status: 200,
    description: 'Form templates retrieved successfully',
  })
  async getFormTemplatesByFilter(
    @Query('grade') grade: string,
    @Query('subject') subject?: string,
  ) {
    return this.formTemplateService.getAvailableTemplates(grade, subject);
  }

  @Get('templates/:formCode')
  @ApiOperation({ summary: 'Get specific form template by code' })
  @ApiParam({
    name: 'formCode',
    description: 'Form template code',
  })
  @ApiResponse({
    status: 200,
    description: 'Form template retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async getTemplateByCode(@Param('formCode') formCode: string) {
    return this.formTemplateService.getTemplateByCode(formCode);
  }

  @Get('recommended')
  @ApiOperation({ summary: 'Get recommended forms for current user' })
  @ApiResponse({
    status: 200,
    description: 'Recommended forms retrieved successfully',
  })
  async getRecommendedForms(@CurrentUser() user: User) {
    return this.formTemplateService.getRecommendedForms(user);
  }

  @Get(':id/metadata')
  @ApiOperation({ summary: 'Get form metadata and statistics' })
  @ApiParam({
    name: 'id',
    description: 'Form ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Form metadata retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalIndicators: { type: 'number' },
        indicatorsByPhase: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        rubricTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        estimatedCompletionTime: { type: 'number' },
      },
    },
  })
  async getFormMetadata(@Param('id') formId: string) {
    return this.formTemplateService.getFormMetadata(formId);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Get form preview for display' })
  @ApiParam({
    name: 'id',
    description: 'Form ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Form preview generated successfully',
  })
  async getFormPreview(@Param('id') formId: string) {
    return this.formTemplateService.generateFormPreview(formId);
  }

  @Get(':id/validate-completeness')
  @ApiOperation({ summary: 'Validate form completeness and structure' })
  @ApiParam({
    name: 'id',
    description: 'Form ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Form validation completed',
    schema: {
      type: 'object',
      properties: {
        isComplete: { type: 'boolean' },
        missingElements: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async validateFormCompleteness(@Param('id') formId: string) {
    return this.formTemplateService.validateFormCompleteness(formId);
  }

  @Post('create-from-template')
  @ApiOperation({ summary: 'Create a new form from a template' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        templateCode: { type: 'string', description: 'Template code to use' },
        customizations: {
          type: 'object',
          description: 'Optional customizations to the template',
          properties: {
            title: { type: 'string' },
            formCode: { type: 'string' },
          },
        },
      },
      required: ['templateCode'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Form created from template successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async createFromTemplate(
    @Body() body: { templateCode: string; customizations?: any },
  ) {
    const template = await this.formTemplateService.getTemplateByCode(body.templateCode);
    
    // Convert template to DTO format
    const createDto: CreateObservationFormDto = {
      formCode: body.customizations?.formCode || template.formCode,
      title: body.customizations?.title || template.title,
      subject: template.subject,
      gradeRange: template.gradeLevel,
      lessonPhases: template.phases.map(phase => ({
        title: phase.title,
        sectionOrder: phase.order,
        indicators: phase.indicators.map(indicator => ({
          indicatorNumber: indicator.number,
          indicatorText: indicator.text,
          maxScore: indicator.maxScore,
          rubricType: indicator.rubricType,
          scales: indicator.scales?.map(scale => ({
            scaleLabel: scale.label,
            scaleDescription: scale.description,
          })),
        })),
      })),
      competencyDomains: template.competencyDomains?.map(domain => ({
        subject: template.subject,
        domainName: domain.domainName,
        indicators: domain.indicators.map(indicator => ({
          indicatorNumber: indicator.number,
          indicatorText: indicator.text,
          maxScore: indicator.maxScore,
          rubricType: indicator.rubricType,
          scales: indicator.scales?.map(scale => ({
            scaleLabel: scale.label,
            scaleDescription: scale.description,
          })),
        })),
      })),
    };

    return this.observationFormsService.create(createDto);
  }
}

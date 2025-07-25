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
} from '@nestjs/swagger';
import { ObservationSessionsService } from './observation-sessions.service';
import { IndicatorResponsesService } from './indicator-responses.service';
import { SessionWorkflowService } from './session-workflow.service';
import { CreateObservationSessionDto } from './dto/create-observation-session.dto';
import { UpdateObservationSessionDto } from './dto/update-observation-session.dto';
import { SessionFilterDto } from './dto/session-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../entities/user.entity';
import { SessionStatus } from '../entities/observation-session.entity';

@ApiTags('Observation Sessions')
@Controller('observation-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ObservationSessionsController {
  constructor(
    private readonly observationSessionsService: ObservationSessionsService,
    private readonly indicatorResponsesService: IndicatorResponsesService,
    private readonly sessionWorkflowService: SessionWorkflowService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new observation session' })
  @ApiResponse({
    status: 201,
    description: 'Observation session created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid form or session data',
  })
  async create(
    @Body() createSessionDto: CreateObservationSessionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.observationSessionsService.create(createSessionDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all observation sessions with filtering and pagination' })
  @ApiQuery({ name: 'observerId', required: false, description: 'Filter by observer ID' })
  @ApiQuery({ name: 'schoolName', required: false, description: 'Filter by school name' })
  @ApiQuery({ name: 'teacherName', required: false, description: 'Filter by teacher name' })
  @ApiQuery({ name: 'subject', required: false, description: 'Filter by subject' })
  @ApiQuery({ name: 'grade', required: false, description: 'Filter by grade' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SessionStatus,
    description: 'Filter by status',
  })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter by date from (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter by date to (YYYY-MM-DD)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by teacher or school name' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiResponse({
    status: 200,
    description: 'Observation sessions retrieved successfully',
  })
  async findAll(@Query() filterDto: SessionFilterDto, @CurrentUser() currentUser?: User) {
    return this.observationSessionsService.findAll(filterDto, currentUser);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get observation session statistics' })
  @ApiResponse({
    status: 200,
    description: 'Session statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        draft: { type: 'number' },
        inProgress: { type: 'number' },
        completed: { type: 'number' },
      },
    },
  })
  async getStatistics(@CurrentUser() currentUser: User) {
    return this.observationSessionsService.getSessionStatistics(currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get observation session by ID' })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Observation session retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.observationSessionsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update observation session' })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Observation session updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied or cannot edit session',
  })
  async update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateObservationSessionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.observationSessionsService.update(id, updateSessionDto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete observation session' })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Observation session deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied or cannot delete session',
  })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    await this.observationSessionsService.remove(id, currentUser);
  }

  // Status management endpoints
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update session status' })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Session status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: SessionStatus,
    @CurrentUser() currentUser: User,
  ) {
    return this.sessionWorkflowService.transitionStatus(id, status, currentUser);
  }

  @Get(':id/workflow')
  @ApiOperation({ summary: 'Get session workflow state' })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Session workflow state retrieved successfully',
  })
  async getWorkflowState(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.sessionWorkflowService.getWorkflowState(id, currentUser);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get session completion progress' })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Session progress retrieved successfully',
  })
  async getProgress(@Param('id') id: string) {
    return this.sessionWorkflowService.getSessionProgress(id);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate session for completion' })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Session validation completed',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async validateSession(@Param('id') id: string) {
    return this.sessionWorkflowService.validateSessionForCompletion(id);
  }

  // Auto-save endpoint
  @Patch(':id/auto-save')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Auto-save session data' })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Session data auto-saved successfully',
  })
  async autoSave(
    @Param('id') id: string,
    @Body() updateData: Partial<UpdateObservationSessionDto>,
    @CurrentUser() currentUser: User,
  ) {
    await this.observationSessionsService.autoSave(id, updateData, currentUser);
  }

  // Indicator responses endpoints
  @Get(':id/responses')
  @ApiOperation({ summary: 'Get indicator responses for session' })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Indicator responses retrieved successfully',
  })
  async getIndicatorResponses(@Param('id') sessionId: string) {
    return this.indicatorResponsesService.findBySession(sessionId);
  }

  @Get(':id/responses/progress')
  @ApiOperation({ summary: 'Get indicator response progress' })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Response progress retrieved successfully',
  })
  async getResponseProgress(@Param('id') sessionId: string) {
    return this.indicatorResponsesService.getSessionProgress(sessionId);
  }

  @Post(':id/responses/validate')
  @ApiOperation({ summary: 'Validate all indicator responses' })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Response validation completed',
  })
  async validateResponses(@Param('id') sessionId: string) {
    return this.indicatorResponsesService.validateAllResponses(sessionId);
  }

  // Approval endpoints (for supervisors)
  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve completed session' })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Session approved successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DIRECTOR)
  async approveSession(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.sessionWorkflowService.transitionStatus(id, SessionStatus.APPROVED, currentUser);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject session and return to draft' })
  @ApiParam({
    name: 'id',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Session rejected and returned to draft',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DIRECTOR)
  async rejectSession(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() currentUser: User,
  ) {
    // For now, just return to draft status
    // In a full implementation, you might want to add rejection reasons
    return this.sessionWorkflowService.transitionStatus(id, SessionStatus.DRAFT, currentUser);
  }
}

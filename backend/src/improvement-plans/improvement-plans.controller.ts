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
import { ImprovementPlansService } from './improvement-plans.service';
import { ImprovementActionsService } from './improvement-actions.service';
import { FollowUpActivitiesService } from './follow-up-activities.service';
import { NotificationService } from './notification.service';
import { CreateImprovementPlanDto } from './dto/create-improvement-plan.dto';
import { UpdateImprovementPlanDto } from './dto/update-improvement-plan.dto';
import { ImprovementPlanFilterDto } from './dto/improvement-plan-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../entities/user.entity';

@ApiTags('Improvement Plans')
@Controller('improvement-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ImprovementPlansController {
  constructor(
    private readonly improvementPlansService: ImprovementPlansService,
    private readonly actionsService: ImprovementActionsService,
    private readonly followUpService: FollowUpActivitiesService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new improvement plan' })
  @ApiResponse({
    status: 201,
    description: 'Improvement plan created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid session or plan already exists',
  })
  async create(@Body() createPlanDto: CreateImprovementPlanDto, @CurrentUser() currentUser: User) {
    return this.improvementPlansService.create(createPlanDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all improvement plans with filtering and pagination' })
  @ApiQuery({ name: 'sessionId', required: false, description: 'Filter by session ID' })
  @ApiQuery({ name: 'teacherName', required: false, description: 'Filter by teacher name' })
  @ApiQuery({ name: 'schoolName', required: false, description: 'Filter by school name' })
  @ApiQuery({ name: 'subject', required: false, description: 'Filter by subject' })
  @ApiQuery({
    name: 'responsiblePerson',
    required: false,
    description: 'Filter by responsible person',
  })
  @ApiQuery({
    name: 'deadlineFrom',
    required: false,
    description: 'Filter by deadline from (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'deadlineTo',
    required: false,
    description: 'Filter by deadline to (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by lesson topic or challenges',
  })
  @ApiQuery({ name: 'showOverdueOnly', required: false, description: 'Show only overdue items' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiResponse({
    status: 200,
    description: 'Improvement plans retrieved successfully',
  })
  async findAll(@Query() filterDto: ImprovementPlanFilterDto, @CurrentUser() currentUser: User) {
    return this.improvementPlansService.findAll(filterDto, currentUser);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get improvement plan statistics' })
  @ApiResponse({
    status: 200,
    description: 'Plan statistics retrieved successfully',
  })
  async getStatistics(@CurrentUser() currentUser: User) {
    return this.improvementPlansService.getStatistics(currentUser);
  }

  @Get('upcoming-deadlines')
  @ApiOperation({ summary: 'Get plans with upcoming deadlines' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days ahead (default: 7)' })
  @ApiResponse({
    status: 200,
    description: 'Upcoming deadlines retrieved successfully',
  })
  async getUpcomingDeadlines(@Query('days') days: number = 7, @CurrentUser() currentUser: User) {
    return this.improvementPlansService.getUpcomingDeadlines(currentUser, days);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue improvement plans' })
  @ApiResponse({
    status: 200,
    description: 'Overdue plans retrieved successfully',
  })
  async getOverduePlans(@CurrentUser() currentUser: User) {
    return this.improvementPlansService.getOverduePlans(currentUser);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get improvement plan by session ID' })
  @ApiParam({
    name: 'sessionId',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Improvement plan retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Plan not found',
  })
  async findBySession(@Param('sessionId') sessionId: string, @CurrentUser() currentUser: User) {
    return this.improvementPlansService.findBySession(sessionId, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get improvement plan by ID' })
  @ApiParam({
    name: 'id',
    description: 'Plan ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Improvement plan retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Plan not found',
  })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.improvementPlansService.findOne(id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update improvement plan' })
  @ApiParam({
    name: 'id',
    description: 'Plan ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Improvement plan updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Plan not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdateImprovementPlanDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.improvementPlansService.update(id, updatePlanDto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete improvement plan' })
  @ApiParam({
    name: 'id',
    description: 'Plan ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Improvement plan deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Plan not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DIRECTOR)
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    await this.improvementPlansService.remove(id, currentUser);
  }

  // Action management endpoints
  @Patch(':id/actions/:actionId/complete')
  @ApiOperation({ summary: 'Mark improvement action as completed' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiParam({ name: 'actionId', description: 'Action ID' })
  @ApiResponse({
    status: 200,
    description: 'Action marked as completed',
  })
  async markActionCompleted(
    @Param('id') planId: string,
    @Param('actionId') actionId: string,
    @CurrentUser() currentUser: User,
  ) {
    await this.improvementPlansService.markActionCompleted(planId, actionId, currentUser);
    return { message: 'Action marked as completed' };
  }

  @Get(':id/actions')
  @ApiOperation({ summary: 'Get actions for improvement plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Actions retrieved successfully',
  })
  async getPlanActions(@Param('id') planId: string) {
    return this.actionsService.findByPlan(planId);
  }

  // Follow-up management endpoints
  @Post(':id/follow-ups/:followUpId/note')
  @ApiOperation({ summary: 'Add note to follow-up activity' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiParam({ name: 'followUpId', description: 'Follow-up ID' })
  @ApiResponse({
    status: 200,
    description: 'Note added successfully',
  })
  async addFollowUpNote(
    @Param('id') planId: string,
    @Param('followUpId') followUpId: string,
    @Body('note') note: string,
    @CurrentUser() currentUser: User,
  ) {
    await this.improvementPlansService.addFollowUpNote(planId, followUpId, note, currentUser);
    return { message: 'Note added successfully' };
  }

  @Get(':id/follow-ups')
  @ApiOperation({ summary: 'Get follow-up activities for improvement plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Follow-up activities retrieved successfully',
  })
  async getPlanFollowUps(@Param('id') planId: string) {
    return this.followUpService.findByPlan(planId);
  }

  @Patch(':id/follow-ups/:followUpId/complete')
  @ApiOperation({ summary: 'Mark follow-up activity as completed' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiParam({ name: 'followUpId', description: 'Follow-up ID' })
  @ApiResponse({
    status: 200,
    description: 'Follow-up marked as completed',
  })
  async markFollowUpCompleted(
    @Param('followUpId') followUpId: string,
    @Body('note') completionNote: string,
  ) {
    await this.followUpService.markCompleted(followUpId, completionNote);
    return { message: 'Follow-up marked as completed' };
  }

  // Notification endpoints
  @Get('notifications/my')
  @ApiOperation({ summary: 'Get notifications for current user' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  async getMyNotifications(@CurrentUser() currentUser: User) {
    return this.notificationService.getNotificationsForUser(currentUser.id);
  }

  @Get('notifications/unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  async getUnreadNotificationsCount(@CurrentUser() currentUser: User) {
    const count = await this.notificationService.getUnreadNotificationsCount(currentUser.id);
    return { count };
  }

  @Patch('notifications/:notificationId/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'notificationId', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
  })
  async markNotificationAsRead(@Param('notificationId') notificationId: string) {
    await this.notificationService.markNotificationAsRead(notificationId);
    return { message: 'Notification marked as read' };
  }

  @Patch('notifications/mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  async markAllNotificationsAsRead(@CurrentUser() currentUser: User) {
    await this.notificationService.markAllNotificationsAsRead(currentUser.id);
    return { message: 'All notifications marked as read' };
  }

  @Post('notifications/custom')
  @ApiOperation({ summary: 'Create custom notification' })
  @ApiResponse({
    status: 201,
    description: 'Custom notification created',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DIRECTOR)
  async createCustomNotification(
    @Body('recipientId') recipientId: string,
    @Body('title') title: string,
    @Body('message') message: string,
    @Body('planId') planId?: string,
  ) {
    return this.notificationService.createCustomNotification(recipientId, title, message, planId);
  }

  // Statistics and reporting endpoints
  @Get('reports/action-statistics')
  @ApiOperation({ summary: 'Get action statistics' })
  @ApiResponse({
    status: 200,
    description: 'Action statistics retrieved successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DIRECTOR)
  async getActionStatistics() {
    return this.actionsService.getActionStatistics();
  }

  @Get('reports/followup-statistics')
  @ApiOperation({ summary: 'Get follow-up statistics' })
  @ApiResponse({
    status: 200,
    description: 'Follow-up statistics retrieved successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DIRECTOR)
  async getFollowUpStatistics() {
    return this.followUpService.getFollowUpStatistics();
  }

  @Get('reports/notification-statistics')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({
    status: 200,
    description: 'Notification statistics retrieved successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async getNotificationStatistics() {
    return this.notificationService.getNotificationStatistics();
  }

  // Validation endpoints
  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate improvement plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Plan validation completed',
  })
  async validatePlan(@Param('id') planId: string) {
    const [actionValidation, followUpValidation] = await Promise.all([
      this.actionsService.validateActionDeadlines(planId),
      this.followUpService.validateFollowUpSchedule(planId),
    ]);

    return {
      actions: actionValidation,
      followUps: followUpValidation,
      overall: {
        isValid: actionValidation.isValid && followUpValidation.isValid,
        warnings: [...actionValidation.warnings, ...followUpValidation.warnings],
      },
    };
  }
}

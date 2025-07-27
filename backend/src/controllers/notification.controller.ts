import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from '../services/notification.service';
import { NotificationPreferences } from '../entities/notification-preferences.entity';

@ApiTags('notifications')
@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications' })
  async getNotifications(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('unreadOnly') unreadOnly?: boolean,
    @Query('type') type?: string[],
    @Query('priority') priority?: string[],
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.notificationService.getNotifications(req.user.sub, {
      page,
      limit,
      unreadOnly,
      type: type as any,
      priority: priority as any,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  async getStats(@Request() req) {
    return this.notificationService.getStats(req.user.sub);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@Request() req) {
    return this.notificationService.getOrCreatePreferences(req.user.sub);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(
    @Request() req,
    @Body() preferences: Partial<NotificationPreferences>,
  ) {
    return this.notificationService.updatePreferences(req.user.sub, preferences);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Request() req, @Param('id') id: string) {
    await this.notificationService.markAsRead(req.user.sub, id);
    return { success: true };
  }

  @Put('read')
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  async markMultipleAsRead(@Request() req, @Body('ids') ids: string[]) {
    await this.notificationService.markMultipleAsRead(req.user.sub, ids);
    return { success: true };
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req) {
    await this.notificationService.markAllAsRead(req.user.sub);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  async deleteNotification(@Request() req, @Param('id') id: string) {
    await this.notificationService.deleteNotification(req.user.sub, id);
    return { success: true };
  }

  @Post('send')
  @ApiOperation({ summary: 'Send notification (admin only)' })
  async sendNotification(@Request() req, @Body() data: any) {
    // Check if user has admin privileges
    if (req.user.role !== 'administrator' && req.user.role !== 'Administrator') {
      throw new Error('Unauthorized');
    }
    
    await this.notificationService.sendNotification(data);
    return { success: true };
  }

  @Post('test')
  @ApiOperation({ summary: 'Send test notification' })
  async testNotification(
    @Request() req,
    @Body('type') type: 'email' | 'sms' | 'push',
  ) {
    await this.notificationService.testNotification(req.user.sub, type);
    return { success: true };
  }

  @Post('push/subscribe')
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  async subscribeToPush(@Request() req, @Body() subscription: any) {
    // Implement push subscription logic
    return { success: true };
  }

  @Delete('push/unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  async unsubscribeFromPush(@Request() req) {
    // Implement push unsubscription logic
    return { success: true };
  }
}
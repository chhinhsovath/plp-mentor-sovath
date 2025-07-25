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
import { SignaturesService } from './signatures.service';
import { ApprovalWorkflowService } from './approval-workflow.service';
import { AuditTrailService } from './audit-trail.service';
import { CreateSignatureDto } from './dto/create-signature.dto';
import { ApprovalRequestDto } from './dto/approval-request.dto';
import { SignatureVerificationDto } from './dto/signature-verification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../entities/user.entity';

@ApiTags('Digital Signatures & Approvals')
@Controller('signatures')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SignaturesController {
  constructor(
    private readonly signaturesService: SignaturesService,
    private readonly approvalWorkflowService: ApprovalWorkflowService,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a digital signature' })
  @ApiResponse({
    status: 201,
    description: 'Signature created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature data or signature already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to sign this session',
  })
  async create(@Body() createSignatureDto: CreateSignatureDto, @CurrentUser() currentUser: User) {
    return this.signaturesService.create(createSignatureDto, currentUser);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get signatures for a session' })
  @ApiParam({
    name: 'sessionId',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Signatures retrieved successfully',
  })
  async getSessionSignatures(@Param('sessionId') sessionId: string) {
    return this.signaturesService.findBySession(sessionId);
  }

  @Get('session/:sessionId/requirements')
  @ApiOperation({ summary: 'Get signature requirements for a session' })
  @ApiParam({
    name: 'sessionId',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Signature requirements retrieved successfully',
  })
  async getSignatureRequirements(@Param('sessionId') sessionId: string) {
    return this.signaturesService.getSignatureRequirements(sessionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get signature by ID' })
  @ApiParam({
    name: 'id',
    description: 'Signature ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Signature retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Signature not found',
  })
  async findOne(@Param('id') id: string) {
    return this.signaturesService.findOne(id);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify a signature' })
  @ApiParam({
    name: 'id',
    description: 'Signature ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Signature verification completed',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to verify signatures',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DIRECTOR)
  async verifySignature(
    @Param('id') id: string,
    @Body() verificationDto: SignatureVerificationDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.signaturesService.verifySignature(id, verificationDto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a signature' })
  @ApiParam({
    name: 'id',
    description: 'Signature ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Signature removed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to remove signatures',
  })
  @Roles(UserRole.ADMINISTRATOR)
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    await this.signaturesService.removeSignature(id, currentUser);
  }

  // Approval workflow endpoints
  @Get('approvals/workflow/:sessionId')
  @ApiOperation({ summary: 'Get approval workflow for a session' })
  @ApiParam({
    name: 'sessionId',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Approval workflow retrieved successfully',
  })
  async getApprovalWorkflow(@Param('sessionId') sessionId: string) {
    return this.approvalWorkflowService.getApprovalWorkflow(sessionId);
  }

  @Post('approvals/process')
  @ApiOperation({ summary: 'Process an approval request' })
  @ApiResponse({
    status: 200,
    description: 'Approval processed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to approve this session',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DIRECTOR)
  async processApproval(@Body() approvalDto: ApprovalRequestDto, @CurrentUser() currentUser: User) {
    return this.approvalWorkflowService.processApproval(approvalDto, currentUser);
  }

  @Get('approvals/pending')
  @ApiOperation({ summary: 'Get pending approvals for current user' })
  @ApiResponse({
    status: 200,
    description: 'Pending approvals retrieved successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DIRECTOR)
  async getPendingApprovals(@CurrentUser() currentUser: User) {
    return this.approvalWorkflowService.getPendingApprovals(currentUser);
  }

  @Get('approvals/history/:sessionId')
  @ApiOperation({ summary: 'Get approval history for a session' })
  @ApiParam({
    name: 'sessionId',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Approval history retrieved successfully',
  })
  async getApprovalHistory(@Param('sessionId') sessionId: string) {
    return this.approvalWorkflowService.getApprovalHistory(sessionId);
  }

  @Post('approvals/delegate')
  @ApiOperation({ summary: 'Delegate approval to another user' })
  @ApiResponse({
    status: 200,
    description: 'Approval delegated successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DIRECTOR)
  async delegateApproval(
    @Body('sessionId') sessionId: string,
    @Body('toUserId') toUserId: string,
    @Body('reason') reason: string,
    @CurrentUser() currentUser: User,
  ) {
    await this.approvalWorkflowService.delegateApproval(
      sessionId,
      currentUser.id,
      toUserId,
      reason,
    );
    return { message: 'Approval delegated successfully' };
  }

  // Audit trail endpoints
  @Get('audit/session/:sessionId')
  @ApiOperation({ summary: 'Get audit trail for a session' })
  @ApiParam({
    name: 'sessionId',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit trail retrieved successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async getSessionAuditTrail(@Param('sessionId') sessionId: string) {
    return this.auditTrailService.getSessionAuditTrail(sessionId);
  }

  @Get('audit/signature/:signatureId')
  @ApiOperation({ summary: 'Get audit trail for a signature' })
  @ApiParam({
    name: 'signatureId',
    description: 'Signature ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Signature audit trail retrieved successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async getSignatureAuditTrail(@Param('signatureId') signatureId: string) {
    return this.auditTrailService.getSignatureAuditTrail(signatureId);
  }

  @Get('audit/user/:userId')
  @ApiOperation({ summary: 'Get audit trail for a user' })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
  })
  @ApiResponse({
    status: 200,
    description: 'User audit trail retrieved successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async getUserAuditTrail(@Param('userId') userId: string) {
    return this.auditTrailService.getUserAuditTrail(userId);
  }

  @Get('audit/search')
  @ApiOperation({ summary: 'Search audit trail' })
  @ApiQuery({ name: 'sessionId', required: false, description: 'Filter by session ID' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter by date from (ISO string)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter by date to (ISO string)' })
  @ApiResponse({
    status: 200,
    description: 'Audit search results retrieved successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async searchAuditTrail(
    @Query('sessionId') sessionId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const criteria: any = {};
    if (sessionId) criteria.sessionId = sessionId;
    if (userId) criteria.userId = userId;
    if (action) criteria.action = action;
    if (dateFrom) criteria.dateFrom = new Date(dateFrom);
    if (dateTo) criteria.dateTo = new Date(dateTo);

    return this.auditTrailService.searchAuditTrail(criteria);
  }

  @Get('audit/export')
  @ApiOperation({ summary: 'Export audit trail' })
  @ApiQuery({ name: 'sessionId', required: false, description: 'Export for specific session' })
  @ApiResponse({
    status: 200,
    description: 'Audit trail exported successfully',
    schema: {
      type: 'string',
      description: 'CSV formatted audit trail',
    },
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE)
  async exportAuditTrail(@Query('sessionId') sessionId?: string) {
    const csvData = await this.auditTrailService.exportAuditTrail(sessionId);
    return { data: csvData, format: 'csv' };
  }

  // Statistics endpoints
  @Get('statistics/signatures')
  @ApiOperation({ summary: 'Get signature statistics' })
  @ApiResponse({
    status: 200,
    description: 'Signature statistics retrieved successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async getSignatureStatistics() {
    return this.signaturesService.getSignatureStatistics();
  }

  @Get('statistics/audit')
  @ApiOperation({ summary: 'Get audit statistics' })
  @ApiResponse({
    status: 200,
    description: 'Audit statistics retrieved successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async getAuditStatistics() {
    return this.auditTrailService.getAuditStatistics();
  }

  @Get('audit/validate')
  @ApiOperation({ summary: 'Validate audit trail integrity' })
  @ApiResponse({
    status: 200,
    description: 'Audit validation completed',
  })
  @Roles(UserRole.ADMINISTRATOR)
  async validateAuditIntegrity() {
    return this.auditTrailService.validateAuditIntegrity();
  }
}

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
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Res,
  UnauthorizedException
} from '@nestjs/common';
import { Response } from 'express';
import { ImpactAssessmentsService } from './impact-assessments.service';
import { CreateImpactAssessmentDto } from './dto/create-impact-assessment.dto';
import { UpdateImpactAssessmentDto } from './dto/update-impact-assessment.dto';
import { ImpactAssessmentFilterDto } from './dto/impact-assessment-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User, UserRole } from '../entities/user.entity';
import { Parser } from 'json2csv';

@Controller('api/impact-assessments')
export class ImpactAssessmentsController {
  constructor(private readonly impactAssessmentsService: ImpactAssessmentsService) {}

  // Public route - Create new impact assessment (no auth required)
  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateImpactAssessmentDto) {
    const assessment = await this.impactAssessmentsService.create(createDto);
    return {
      success: true,
      data: assessment,
      message: 'Impact assessment submitted successfully'
    };
  }

  // Get all impact assessments with filters (requires auth)
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() filters: ImpactAssessmentFilterDto) {
    const result = await this.impactAssessmentsService.findAll(filters);
    return {
      success: true,
      ...result
    };
  }

  // Get statistics (requires auth)
  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  async getStatistics(@Query() filters: ImpactAssessmentFilterDto) {
    const statistics = await this.impactAssessmentsService.getStatistics(filters);
    return {
      success: true,
      data: statistics
    };
  }

  // Export to CSV (requires auth)
  @Get('export/csv')
  @UseGuards(JwtAuthGuard)
  async exportToCSV(@Query() filters: ImpactAssessmentFilterDto, @Res() res: Response) {
    const data = await this.impactAssessmentsService.exportToCSV(filters);
    
    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data to export'
      });
    }

    const fields = Object.keys(data[0]);
    const opts = { fields, withBOM: true };
    const parser = new Parser(opts);
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`impact-assessment-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  }

  // Get single impact assessment by ID
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const assessment = await this.impactAssessmentsService.findOne(id);
    return {
      success: true,
      data: assessment
    };
  }

  // Update impact assessment (requires auth)
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateImpactAssessmentDto
  ) {
    const assessment = await this.impactAssessmentsService.update(id, updateDto);
    return {
      success: true,
      data: assessment,
      message: 'Impact assessment updated successfully'
    };
  }

  // Delete impact assessment (requires auth and admin role)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.impactAssessmentsService.remove(id);
    return {
      success: true,
      message: 'Impact assessment deleted successfully'
    };
  }

  // Verify/Approve impact assessment (requires auth)
  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEPARTMENT, UserRole.PROVINCIAL, UserRole.ZONE, UserRole.ADMINISTRATOR)
  async verify(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() body: { status: 'verified' | 'rejected'; verificationNotes?: string }
  ) {
    const { status, verificationNotes } = body;

    if (!['verified', 'rejected'].includes(status)) {
      throw new UnauthorizedException('Invalid status. Must be either "verified" or "rejected"');
    }

    const assessment = await this.impactAssessmentsService.verify(id, user, status, verificationNotes);
    return {
      success: true,
      data: assessment,
      message: `Impact assessment ${status} successfully`
    };
  }

  // Bulk delete (requires auth and admin role)
  @Post('bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async bulkDelete(@Body() body: { ids: string[] }) {
    const { ids } = body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new UnauthorizedException('Please provide an array of IDs');
    }

    const result = await this.impactAssessmentsService.bulkDelete(ids);
    return {
      success: true,
      message: `${result.deletedCount} impact assessments deleted successfully`
    };
  }
}
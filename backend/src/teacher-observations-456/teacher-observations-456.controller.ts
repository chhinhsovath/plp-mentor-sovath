import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TeacherObservations456Service } from './teacher-observations-456.service';
import { CreateTeacherObservationDto } from './dto/create-teacher-observation.dto';
import { UpdateTeacherObservationDto } from './dto/update-teacher-observation.dto';

@ApiTags('teacher-observations-456')
@Controller('teacher-observations-456')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TeacherObservations456Controller {
  constructor(private readonly service: TeacherObservations456Service) {}

  @Post()
  @ApiOperation({ summary: 'Create a new teacher observation for grades 4-5-6' })
  @Roles('teacher', 'observer', 'director', 'cluster', 'department', 'provincial', 'zone', 'administrator')
  async create(@Body() createDto: CreateTeacherObservationDto, @Req() req: any) {
    return await this.service.create(createDto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all teacher observations with optional filters' })
  @Roles('teacher', 'observer', 'director', 'cluster', 'department', 'provincial', 'zone', 'administrator')
  async findAll(
    @Query('schoolCode') schoolCode?: string,
    @Query('grade') grade?: string,
    @Query('subject') subject?: string,
    @Query('observerId') observerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.service.findAll({
      schoolCode,
      grade,
      subject,
      observerId,
      startDate,
      endDate,
    });
  }

  @Get('statistics/school/:schoolCode')
  @ApiOperation({ summary: 'Get statistics for a specific school' })
  @Roles('director', 'cluster', 'department', 'provincial', 'zone', 'administrator')
  async getSchoolStatistics(
    @Param('schoolCode') schoolCode: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.service.getStatisticsBySchool(schoolCode, startDate, endDate);
  }

  @Get('report')
  @ApiOperation({ summary: 'Get detailed report with filters' })
  @Roles('director', 'cluster', 'department', 'provincial', 'zone', 'administrator')
  async getDetailedReport(
    @Query('schoolCode') schoolCode?: string,
    @Query('grade') grade?: string,
    @Query('subject') subject?: string,
    @Query('observerId') observerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.service.getDetailedReport({
      schoolCode,
      grade,
      subject,
      observerId,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific teacher observation by ID' })
  @Roles('teacher', 'observer', 'director', 'cluster', 'department', 'provincial', 'zone', 'administrator')
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a teacher observation' })
  @Roles('teacher', 'observer', 'director', 'cluster', 'department', 'provincial', 'zone', 'administrator')
  async update(@Param('id') id: string, @Body() updateDto: UpdateTeacherObservationDto) {
    return await this.service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a teacher observation' })
  @Roles('administrator', 'zone', 'provincial', 'department')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { message: 'Observation deleted successfully' };
  }
}
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
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MissionsService } from './missions.service';
import { CreateMissionDto, AddParticipantDto, UpdateMissionStatusDto, MissionTrackingDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { MissionFilterDto } from './dto/mission-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Mission } from '../entities/mission.entity';

@ApiTags('missions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new mission' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Mission created successfully', type: Mission })
  create(@Body() createMissionDto: CreateMissionDto, @Request() req) {
    return this.missionsService.create(createMissionDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all missions with filtering' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of missions' })
  findAll(@Query() filter: MissionFilterDto, @Request() req) {
    return this.missionsService.findAll(filter, req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a mission by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Mission details', type: Mission })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Mission not found' })
  findOne(@Param('id') id: string) {
    return this.missionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a mission' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Mission updated successfully', type: Mission })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Mission not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not authorized to update this mission' })
  update(@Param('id') id: string, @Body() updateMissionDto: UpdateMissionDto, @Request() req) {
    return this.missionsService.update(id, updateMissionDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a mission' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Mission deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Mission not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not authorized to delete this mission' })
  remove(@Param('id') id: string, @Request() req) {
    return this.missionsService.remove(id, req.user.userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update mission status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Mission status updated successfully', type: Mission })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Mission not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not authorized to update mission status' })
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateMissionStatusDto, @Request() req) {
    return this.missionsService.updateStatus(id, updateStatusDto, req.user.userId);
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Add a participant to a mission' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Participant added successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Mission or user not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Participant already exists' })
  addParticipant(@Param('id') id: string, @Body() addParticipantDto: AddParticipantDto, @Request() req) {
    return this.missionsService.addParticipant(id, addParticipantDto, req.user.userId);
  }

  @Delete(':id/participants/:participantId')
  @ApiOperation({ summary: 'Remove a participant from a mission' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Participant removed successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Mission or participant not found' })
  removeParticipant(@Param('id') id: string, @Param('participantId') participantId: string, @Request() req) {
    return this.missionsService.removeParticipant(id, participantId, req.user.userId);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm participation in a mission' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Participation confirmed' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not a participant of this mission' })
  confirmParticipation(@Param('id') id: string, @Request() req) {
    return this.missionsService.confirmParticipation(id, req.user.userId);
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Check in to a mission' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Checked in successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not a participant of this mission' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Mission is not in progress' })
  checkIn(@Param('id') id: string, @Request() req) {
    return this.missionsService.checkIn(id, req.user.userId);
  }

  @Post(':id/tracking')
  @ApiOperation({ summary: 'Add tracking data for a mission' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Tracking data added successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Mission not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not a participant of this mission' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Mission is not in progress' })
  addTracking(@Param('id') id: string, @Body() trackingDto: MissionTrackingDto, @Request() req) {
    return this.missionsService.addTracking(id, trackingDto, req.user.userId);
  }
}
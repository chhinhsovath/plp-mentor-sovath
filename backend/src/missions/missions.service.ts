import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Mission, MissionStatus, MissionParticipant, MissionTracking } from '../entities/mission.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateMissionDto, AddParticipantDto, UpdateMissionStatusDto, MissionTrackingDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { MissionFilterDto } from './dto/mission-filter.dto';
import { HierarchyService } from '../hierarchy/hierarchy.service';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission)
    private missionRepository: Repository<Mission>,
    @InjectRepository(MissionParticipant)
    private participantRepository: Repository<MissionParticipant>,
    @InjectRepository(MissionTracking)
    private trackingRepository: Repository<MissionTracking>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private hierarchyService: HierarchyService,
  ) {}

  async create(createMissionDto: CreateMissionDto, userId: string): Promise<Mission> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const mission = this.missionRepository.create({
      ...createMissionDto,
      createdBy: user,
      status: MissionStatus.DRAFT,
    });

    const savedMission = await this.missionRepository.save(mission);

    // Add participants if provided
    if (createMissionDto.participants && createMissionDto.participants.length > 0) {
      await this.addMultipleParticipants(savedMission.id, createMissionDto.participants, userId);
    }

    return this.findOne(savedMission.id);
  }

  async findAll(filter: MissionFilterDto, userId: string): Promise<{ missions: Mission[]; total: number }> {
    const queryBuilder = this.missionRepository.createQueryBuilder('mission')
      .leftJoinAndSelect('mission.createdBy', 'createdBy')
      .leftJoinAndSelect('mission.approvedBy', 'approvedBy')
      .leftJoinAndSelect('mission.missionParticipants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser');

    // Apply filters
    if (filter.type) {
      queryBuilder.andWhere('mission.type = :type', { type: filter.type });
    }

    if (filter.status) {
      queryBuilder.andWhere('mission.status = :status', { status: filter.status });
    }

    if (filter.startDateFrom) {
      queryBuilder.andWhere('mission.startDate >= :startDateFrom', { startDateFrom: filter.startDateFrom });
    }

    if (filter.startDateTo) {
      queryBuilder.andWhere('mission.startDate <= :startDateTo', { startDateTo: filter.startDateTo });
    }

    if (filter.createdBy) {
      queryBuilder.andWhere('mission.createdBy = :createdBy', { createdBy: filter.createdBy });
    }

    if (filter.participantId) {
      queryBuilder.andWhere('participantUser.id = :participantId', { participantId: filter.participantId });
    }

    // Apply hierarchy-based filtering
    const user = await this.userRepository.findOne({ 
      where: { id: userId }
    });

    if (user && user.role) {
      const accessibleUsers = await this.hierarchyService.getAccessibleUsers(user);
      const accessibleUserIds = accessibleUsers.map(u => u.id);
      if (accessibleUserIds.length > 0) {
        queryBuilder.andWhere('(mission.createdBy IN (:...userIds) OR participantUser.id = :currentUserId)', {
          userIds: accessibleUserIds,
          currentUserId: userId,
        });
      }
    }

    // Pagination
    const page = parseInt(filter.page || '1', 10);
    const limit = parseInt(filter.limit || '10', 10);
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Sorting
    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'DESC';
    queryBuilder.orderBy(`mission.${sortBy}`, sortOrder);

    const [missions, total] = await queryBuilder.getManyAndCount();

    return { missions, total };
  }

  async findOne(id: string): Promise<Mission> {
    const mission = await this.missionRepository.findOne({
      where: { id },
      relations: ['createdBy', 'approvedBy', 'missionParticipants', 'missionParticipants.user', 'trackingData'],
    });

    if (!mission) {
      throw new NotFoundException(`Mission with ID ${id} not found`);
    }

    return mission;
  }

  async update(id: string, updateMissionDto: UpdateMissionDto, userId: string): Promise<Mission> {
    const mission = await this.findOne(id);

    // Check if user can update the mission
    if (mission.createdBy.id !== userId && mission.status !== MissionStatus.DRAFT) {
      throw new ForbiddenException('You can only update your own missions or missions in draft status');
    }

    Object.assign(mission, updateMissionDto);
    await this.missionRepository.save(mission);

    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const mission = await this.findOne(id);

    // Check if user can delete the mission
    if (mission.createdBy.id !== userId && mission.status !== MissionStatus.DRAFT) {
      throw new ForbiddenException('You can only delete your own missions in draft status');
    }

    await this.missionRepository.remove(mission);
  }

  async updateStatus(id: string, updateStatusDto: UpdateMissionStatusDto, userId: string): Promise<Mission> {
    const mission = await this.findOne(id);
    const user = await this.userRepository.findOne({ 
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate status transition
    this.validateStatusTransition(mission.status, updateStatusDto.status, user, mission);

    // Update status and related fields
    mission.status = updateStatusDto.status;

    if (updateStatusDto.status === MissionStatus.APPROVED) {
      mission.approvedBy = user;
      mission.approvedAt = new Date();
      mission.approvalComments = updateStatusDto.approvalComments;
    } else if (updateStatusDto.status === MissionStatus.REJECTED) {
      mission.rejectionReason = updateStatusDto.rejectionReason;
    } else if (updateStatusDto.status === MissionStatus.IN_PROGRESS) {
      mission.actualStartTime = new Date();
    } else if (updateStatusDto.status === MissionStatus.COMPLETED) {
      mission.actualEndTime = new Date();
    }

    await this.missionRepository.save(mission);

    return this.findOne(id);
  }

  async addParticipant(missionId: string, addParticipantDto: AddParticipantDto, userId: string): Promise<MissionParticipant> {
    const mission = await this.findOne(missionId);
    
    // Check if user can add participants
    if (mission.createdBy.id !== userId && mission.status !== MissionStatus.DRAFT) {
      throw new ForbiddenException('You can only add participants to your own missions in draft status');
    }

    // Check if participant already exists
    const existingParticipant = await this.participantRepository.findOne({
      where: { mission: { id: missionId }, user: { id: addParticipantDto.userId } },
    });

    if (existingParticipant) {
      throw new BadRequestException('Participant already added to this mission');
    }

    const participant = await this.userRepository.findOne({ where: { id: addParticipantDto.userId } });
    if (!participant) {
      throw new NotFoundException('Participant user not found');
    }

    const missionParticipant = this.participantRepository.create({
      mission,
      user: participant,
      role: addParticipantDto.role || 'participant',
      isLeader: addParticipantDto.isLeader || false,
    });

    return this.participantRepository.save(missionParticipant);
  }

  async removeParticipant(missionId: string, participantId: string, userId: string): Promise<void> {
    const mission = await this.findOne(missionId);
    
    // Check if user can remove participants
    if (mission.createdBy.id !== userId && mission.status !== MissionStatus.DRAFT) {
      throw new ForbiddenException('You can only remove participants from your own missions in draft status');
    }

    const participant = await this.participantRepository.findOne({
      where: { mission: { id: missionId }, user: { id: participantId } },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found in this mission');
    }

    await this.participantRepository.remove(participant);
  }

  async confirmParticipation(missionId: string, userId: string): Promise<MissionParticipant> {
    const participant = await this.participantRepository.findOne({
      where: { mission: { id: missionId }, user: { id: userId } },
      relations: ['mission', 'user'],
    });

    if (!participant) {
      throw new NotFoundException('You are not a participant of this mission');
    }

    participant.hasConfirmed = true;
    participant.confirmedAt = new Date();

    return this.participantRepository.save(participant);
  }

  async checkIn(missionId: string, userId: string): Promise<MissionParticipant> {
    const participant = await this.participantRepository.findOne({
      where: { mission: { id: missionId }, user: { id: userId } },
      relations: ['mission'],
    });

    if (!participant) {
      throw new NotFoundException('You are not a participant of this mission');
    }

    if (participant.mission.status !== MissionStatus.IN_PROGRESS) {
      throw new BadRequestException('Mission is not in progress');
    }

    participant.hasCheckedIn = true;
    participant.checkedInAt = new Date();

    return this.participantRepository.save(participant);
  }

  async addTracking(missionId: string, trackingDto: MissionTrackingDto, userId: string): Promise<MissionTracking> {
    const mission = await this.findOne(missionId);
    
    // Check if user is a participant
    const participant = await this.participantRepository.findOne({
      where: { mission: { id: missionId }, user: { id: userId } },
    });

    if (!participant) {
      throw new ForbiddenException('You must be a participant to add tracking data');
    }

    if (mission.status !== MissionStatus.IN_PROGRESS) {
      throw new BadRequestException('Mission is not in progress');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    const tracking = this.trackingRepository.create({
      mission,
      user,
      ...trackingDto,
      recordedAt: new Date(),
    });

    return this.trackingRepository.save(tracking);
  }

  private validateStatusTransition(currentStatus: MissionStatus, newStatus: MissionStatus, user: User, mission: Mission): void {
    const transitions: Record<MissionStatus, MissionStatus[]> = {
      [MissionStatus.DRAFT]: [MissionStatus.SUBMITTED, MissionStatus.CANCELLED],
      [MissionStatus.SUBMITTED]: [MissionStatus.APPROVED, MissionStatus.REJECTED, MissionStatus.CANCELLED],
      [MissionStatus.APPROVED]: [MissionStatus.IN_PROGRESS, MissionStatus.CANCELLED],
      [MissionStatus.REJECTED]: [MissionStatus.DRAFT],
      [MissionStatus.IN_PROGRESS]: [MissionStatus.COMPLETED, MissionStatus.CANCELLED],
      [MissionStatus.COMPLETED]: [],
      [MissionStatus.CANCELLED]: [],
    };

    if (!transitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }

    // Check permissions for specific transitions
    if (newStatus === MissionStatus.APPROVED || newStatus === MissionStatus.REJECTED) {
      // For now, allow zone, provincial, and administrator roles to approve missions
      const approverRoles = [UserRole.ZONE, UserRole.PROVINCIAL, UserRole.ADMINISTRATOR];
      if (!user.role || !approverRoles.includes(user.role)) {
        throw new ForbiddenException('You do not have permission to approve or reject missions');
      }
    }

    if (newStatus === MissionStatus.SUBMITTED && mission.createdBy.id !== user.id) {
      throw new ForbiddenException('Only the mission creator can submit the mission');
    }
  }

  private async addMultipleParticipants(missionId: string, userIds: string[], addedBy: string): Promise<void> {
    const mission = await this.findOne(missionId);
    
    for (const userId of userIds) {
      try {
        await this.addParticipant(missionId, { userId, role: 'participant', isLeader: false }, addedBy);
      } catch (error) {
        // Skip if participant already exists
        if (error instanceof BadRequestException && error.message.includes('already added')) {
          continue;
        }
        throw error;
      }
    }
  }
}
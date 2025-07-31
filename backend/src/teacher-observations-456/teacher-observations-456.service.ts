import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherObservation456 } from '../entities/teacher-observation-456.entity';
import { CreateTeacherObservationDto } from './dto/create-teacher-observation.dto';
import { UpdateTeacherObservationDto } from './dto/update-teacher-observation.dto';

@Injectable()
export class TeacherObservations456Service {
  constructor(
    @InjectRepository(TeacherObservation456)
    private readonly repository: Repository<TeacherObservation456>,
  ) {}

  async create(createDto: CreateTeacherObservationDto, userId?: string): Promise<TeacherObservation456> {
    // Calculate total scores
    const totalIntroductionScore = Object.values(createDto.introductionScores).reduce((sum, score) => sum + score, 0);
    const totalTeachingScore = Object.values(createDto.teachingScores).reduce((sum, score) => sum + score, 0);
    const totalLearningScore = Object.values(createDto.learningScores).reduce((sum, score) => sum + score, 0);
    const totalAssessmentScore = Object.values(createDto.assessmentScores).reduce((sum, score) => sum + score, 0);
    const overallScore = totalIntroductionScore + totalTeachingScore + totalLearningScore + totalAssessmentScore;

    const observation = this.repository.create({
      ...createDto,
      observerId: userId || createDto.observerId,
      totalIntroductionScore,
      totalTeachingScore,
      totalLearningScore,
      totalAssessmentScore,
      overallScore,
    });

    return await this.repository.save(observation);
  }

  async findAll(filters?: {
    schoolCode?: string;
    grade?: string;
    subject?: string;
    observerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TeacherObservation456[]> {
    const query = this.repository.createQueryBuilder('observation');

    if (filters?.schoolCode) {
      query.andWhere('observation.schoolCode = :schoolCode', { schoolCode: filters.schoolCode });
    }

    if (filters?.grade) {
      query.andWhere('observation.grade = :grade', { grade: filters.grade });
    }

    if (filters?.subject) {
      query.andWhere('observation.subject = :subject', { subject: filters.subject });
    }

    if (filters?.observerId) {
      query.andWhere('observation.observerId = :observerId', { observerId: filters.observerId });
    }

    if (filters?.startDate) {
      query.andWhere('observation.observationDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('observation.observationDate <= :endDate', { endDate: filters.endDate });
    }

    query.orderBy('observation.observationDate', 'DESC');

    return await query.getMany();
  }

  async findOne(id: string): Promise<TeacherObservation456> {
    const observation = await this.repository.findOne({
      where: { id },
      relations: ['observer'],
    });

    if (!observation) {
      throw new NotFoundException(`Observation with ID ${id} not found`);
    }

    return observation;
  }

  async update(id: string, updateDto: UpdateTeacherObservationDto): Promise<TeacherObservation456> {
    const observation = await this.findOne(id);

    // Recalculate scores if any score section is updated
    if (updateDto.introductionScores || updateDto.teachingScores || updateDto.learningScores || updateDto.assessmentScores) {
      const introductionScores = updateDto.introductionScores || observation.introductionScores;
      const teachingScores = updateDto.teachingScores || observation.teachingScores;
      const learningScores = updateDto.learningScores || observation.learningScores;
      const assessmentScores = updateDto.assessmentScores || observation.assessmentScores;

      updateDto['totalIntroductionScore'] = Object.values(introductionScores).reduce((sum, score) => sum + score, 0);
      updateDto['totalTeachingScore'] = Object.values(teachingScores).reduce((sum, score) => sum + score, 0);
      updateDto['totalLearningScore'] = Object.values(learningScores).reduce((sum, score) => sum + score, 0);
      updateDto['totalAssessmentScore'] = Object.values(assessmentScores).reduce((sum, score) => sum + score, 0);
      updateDto['overallScore'] = updateDto['totalIntroductionScore'] + updateDto['totalTeachingScore'] + 
                                  updateDto['totalLearningScore'] + updateDto['totalAssessmentScore'];
    }

    Object.assign(observation, updateDto);
    return await this.repository.save(observation);
  }

  async remove(id: string): Promise<void> {
    const observation = await this.findOne(id);
    await this.repository.remove(observation);
  }

  // Report generation methods
  async getStatisticsBySchool(schoolCode: string, startDate?: string, endDate?: string): Promise<any> {
    const query = this.repository.createQueryBuilder('observation');
    
    query.where('observation.schoolCode = :schoolCode', { schoolCode });

    if (startDate) {
      query.andWhere('observation.observationDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('observation.observationDate <= :endDate', { endDate });
    }

    const observations = await query.getMany();

    const stats = {
      totalObservations: observations.length,
      averageScores: {
        introduction: 0,
        teaching: 0,
        learning: 0,
        assessment: 0,
        overall: 0,
      },
      gradeDistribution: {},
      subjectDistribution: {},
      scoreDistribution: {
        excellent: 0, // > 80%
        good: 0,      // 60-80%
        needsImprovement: 0, // < 60%
      },
    };

    if (observations.length === 0) return stats;

    // Calculate averages and distributions
    observations.forEach(obs => {
      stats.averageScores.introduction += obs.totalIntroductionScore;
      stats.averageScores.teaching += obs.totalTeachingScore;
      stats.averageScores.learning += obs.totalLearningScore;
      stats.averageScores.assessment += obs.totalAssessmentScore;
      stats.averageScores.overall += obs.overallScore;

      // Grade distribution
      stats.gradeDistribution[obs.grade] = (stats.gradeDistribution[obs.grade] || 0) + 1;

      // Subject distribution
      stats.subjectDistribution[obs.subject] = (stats.subjectDistribution[obs.subject] || 0) + 1;

      // Score distribution (assuming max score is 100)
      const percentageScore = (obs.overallScore / 100) * 100;
      if (percentageScore > 80) {
        stats.scoreDistribution.excellent++;
      } else if (percentageScore >= 60) {
        stats.scoreDistribution.good++;
      } else {
        stats.scoreDistribution.needsImprovement++;
      }
    });

    // Calculate averages
    Object.keys(stats.averageScores).forEach(key => {
      stats.averageScores[key] = Math.round(stats.averageScores[key] / observations.length * 100) / 100;
    });

    return stats;
  }

  async getDetailedReport(filters?: any): Promise<any> {
    const observations = await this.findAll(filters);

    return {
      summary: {
        totalObservations: observations.length,
        dateRange: {
          start: filters?.startDate || 'All time',
          end: filters?.endDate || 'Present',
        },
      },
      data: observations.map(obs => ({
        id: obs.id,
        schoolName: obs.schoolName,
        schoolCode: obs.schoolCode,
        observationDate: obs.observationDate,
        grade: obs.grade,
        subject: obs.subject,
        teacherName: obs.teacherName,
        observerName: obs.observerName,
        scores: {
          introduction: obs.totalIntroductionScore,
          teaching: obs.totalTeachingScore,
          learning: obs.totalLearningScore,
          assessment: obs.totalAssessmentScore,
          overall: obs.overallScore,
        },
        studentCounts: obs.studentCounts,
      })),
    };
  }
}
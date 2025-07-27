import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImpactAssessment } from '../entities/impact-assessment.entity';
import { CreateImpactAssessmentDto } from './dto/create-impact-assessment.dto';
import { UpdateImpactAssessmentDto } from './dto/update-impact-assessment.dto';
import { ImpactAssessmentFilterDto } from './dto/impact-assessment-filter.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class ImpactAssessmentsService {
  constructor(
    @InjectRepository(ImpactAssessment)
    private readonly impactAssessmentRepository: Repository<ImpactAssessment>,
  ) {}

  async create(createDto: CreateImpactAssessmentDto): Promise<ImpactAssessment> {
    const assessment = this.impactAssessmentRepository.create(createDto);
    return await this.impactAssessmentRepository.save(assessment);
  }

  async findAll(filters: ImpactAssessmentFilterDto) {
    const {
      province,
      severity,
      startDate,
      endDate,
      schoolType,
      status,
      page = 1,
      limit = 10,
      sortBy = 'submittedAt',
      sortOrder = 'DESC'
    } = filters;

    const query = this.impactAssessmentRepository.createQueryBuilder('assessment')
      .leftJoinAndSelect('assessment.verifiedBy', 'verifiedBy');

    // Apply filters
    if (province) {
      query.andWhere('assessment.province = :province', { province });
    }
    if (severity) {
      query.andWhere('assessment.severity = :severity', { severity });
    }
    if (schoolType) {
      query.andWhere('assessment.schoolType = :schoolType', { schoolType });
    }
    if (status) {
      query.andWhere('assessment.status = :status', { status });
    }
    if (startDate) {
      query.andWhere('assessment.incidentDate >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('assessment.incidentDate <= :endDate', { endDate });
    }

    // Apply sorting
    const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query.orderBy(`assessment.${sortBy}`, orderDirection);

    // Apply pagination
    const skip = (page - 1) * limit;
    query.skip(skip).limit(limit);

    const [assessments, total] = await query.getManyAndCount();

    return {
      data: assessments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    };
  }

  async findOne(id: string): Promise<ImpactAssessment> {
    const assessment = await this.impactAssessmentRepository.findOne({
      where: { id },
      relations: ['verifiedBy']
    });

    if (!assessment) {
      throw new NotFoundException('Impact assessment not found');
    }

    return assessment;
  }

  async update(id: string, updateDto: UpdateImpactAssessmentDto): Promise<ImpactAssessment> {
    const assessment = await this.findOne(id);
    
    // Remove fields that shouldn't be updated
    delete updateDto.id;
    delete updateDto.createdAt;
    delete updateDto.submittedAt;

    Object.assign(assessment, updateDto);
    return await this.impactAssessmentRepository.save(assessment);
  }

  async remove(id: string): Promise<void> {
    const assessment = await this.findOne(id);
    await this.impactAssessmentRepository.remove(assessment);
  }

  async verify(id: string, user: User, status: 'verified' | 'rejected', verificationNotes?: string): Promise<ImpactAssessment> {
    const assessment = await this.findOne(id);
    
    assessment.status = status;
    assessment.verifiedBy = user;
    assessment.verifiedAt = new Date();
    assessment.verificationNotes = verificationNotes;

    return await this.impactAssessmentRepository.save(assessment);
  }

  async getStatistics(filters: any = {}) {
    const query = this.impactAssessmentRepository.createQueryBuilder('assessment');

    // Apply filters
    if (filters.province) {
      query.andWhere('assessment.province = :province', { province: filters.province });
    }
    if (filters.severity) {
      query.andWhere('assessment.severity = :severity', { severity: filters.severity });
    }
    if (filters.status) {
      query.andWhere('assessment.status = :status', { status: filters.status });
    }
    if (filters.startDate) {
      query.andWhere('assessment.incidentDate >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      query.andWhere('assessment.incidentDate <= :endDate', { endDate: filters.endDate });
    }

    // Get basic statistics
    const totalReports = await query.getCount();
    
    // Get unique schools
    const schoolsQuery = query.clone();
    const schools = await schoolsQuery
      .select('DISTINCT assessment.schoolName')
      .getRawMany();
    const affectedSchools = schools.length;

    // Get total affected students and teachers
    const totalsQuery = query.clone();
    const totals = await totalsQuery
      .select('SUM(JSON_EXTRACT(assessment.totals, "$.totalAffected"))', 'totalAffectedStudents')
      .addSelect('SUM(assessment.teacherAffected)', 'totalAffectedTeachers')
      .getRawOne();

    // Get statistics by province
    const provinceQuery = query.clone();
    const byProvince = await provinceQuery
      .select('assessment.province', 'province')
      .addSelect('COUNT(*)', 'count')
      .groupBy('assessment.province')
      .getRawMany();

    // Get statistics by severity
    const severityQuery = query.clone();
    const bySeverity = await severityQuery
      .select('assessment.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('assessment.severity')
      .getRawMany();

    // Get statistics by school type
    const schoolTypeQuery = query.clone();
    const bySchoolType = await schoolTypeQuery
      .select('assessment.schoolType', 'schoolType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('assessment.schoolType')
      .getRawMany();

    // Get monthly trends (last 12 months)
    const monthlyQuery = query.clone();
    const byMonth = await monthlyQuery
      .select("DATE_FORMAT(assessment.incidentDate, '%Y-%m')", 'month')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(JSON_EXTRACT(assessment.totals, "$.totalAffected"))', 'affectedStudents')
      .groupBy('month')
      .orderBy('month', 'DESC')
      .limit(12)
      .getRawMany();

    return {
      totalReports,
      affectedSchools,
      totalAffectedStudents: parseInt(totals?.totalAffectedStudents || 0),
      totalAffectedTeachers: parseInt(totals?.totalAffectedTeachers || 0),
      byProvince: byProvince.reduce((acc, item) => {
        acc[item.province] = parseInt(item.count);
        return acc;
      }, {}),
      bySeverity: bySeverity.reduce((acc, item) => {
        acc[item.severity] = parseInt(item.count);
        return acc;
      }, {}),
      bySchoolType: bySchoolType.reduce((acc, item) => {
        acc[item.schoolType] = parseInt(item.count);
        return acc;
      }, {}),
      byMonth: byMonth.map(item => ({
        month: item.month,
        count: parseInt(item.count),
        affectedStudents: parseInt(item.affectedStudents || 0)
      }))
    };
  }

  async exportToCSV(filters: any = {}): Promise<any[]> {
    const query = this.impactAssessmentRepository.createQueryBuilder('assessment');

    // Apply filters
    if (filters.province) {
      query.andWhere('assessment.province = :province', { province: filters.province });
    }
    if (filters.severity) {
      query.andWhere('assessment.severity = :severity', { severity: filters.severity });
    }
    if (filters.status) {
      query.andWhere('assessment.status = :status', { status: filters.status });
    }
    if (filters.startDate) {
      query.andWhere('assessment.incidentDate >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      query.andWhere('assessment.incidentDate <= :endDate', { endDate: filters.endDate });
    }

    const assessments = await query.orderBy('assessment.submittedAt', 'DESC').getMany();

    // Transform data for CSV export
    return assessments.map(a => ({
      'លេខសម្គាល់': a.id,
      'កាលបរិច្ឆេទបញ្ជូន': a.submittedAt,
      'ឈ្មោះសាលា': a.schoolName,
      'ប្រភេទសាលា': a.schoolType,
      'ខេត្ត': a.province,
      'ស្រុក': a.district,
      'ឃុំ': a.commune,
      'ភូមិ': a.village,
      'សិស្សសរុប': a.totals.totalStudents,
      'សិស្សរងផលប៉ះពាល់': a.totals.totalAffected,
      'ភាគរយ': `${a.totals.percentage}%`,
      'គ្រូរងផលប៉ះពាល់': a.teacherAffected || 0,
      'កម្រិតធ្ងន់ធ្ងរ': a.severity,
      'កាលបរិច្ឆេទកើតហេតុ': a.incidentDate,
      'រយៈពេល(ថ្ងៃ)': a.duration || '',
      'ប្រភេទផលប៉ះពាល់': a.impactTypes.join(', '),
      'ស្ថានភាព': a.status,
      'ពិពណ៌នា': a.description || ''
    }));
  }

  async bulkDelete(ids: string[]): Promise<{ deletedCount: number }> {
    const result = await this.impactAssessmentRepository.delete(ids);
    return { deletedCount: result.affected || 0 };
  }
}
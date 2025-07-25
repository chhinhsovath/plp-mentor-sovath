import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Survey, Question, SurveyResponse, Answer } from '../entities';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { SurveyFilterDto } from './dto/survey-filter.dto';
import { v4 as uuidv4 } from 'uuid';
const slugify = require('slugify');

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(SurveyResponse)
    private responseRepository: Repository<SurveyResponse>,
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    private dataSource: DataSource,
  ) {}

  async create(createSurveyDto: CreateSurveyDto, userId: string): Promise<Survey> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate unique slug
      let slug = slugify(createSurveyDto.title, { lower: true, strict: true });
      let counter = 0;
      let uniqueSlug = slug;

      while (await this.surveyRepository.findOne({ where: { slug: uniqueSlug } })) {
        counter++;
        uniqueSlug = `${slug}-${counter}`;
      }

      // Create survey
      const survey = queryRunner.manager.create(Survey, {
        ...createSurveyDto,
        slug: uniqueSlug,
        createdBy: { id: userId },
        status: 'draft',
      });

      const savedSurvey = await queryRunner.manager.save(Survey, survey);

      // Create questions
      if (createSurveyDto.questions && createSurveyDto.questions.length > 0) {
        const questions = createSurveyDto.questions.map((q) =>
          queryRunner.manager.create(Question, {
            ...q,
            surveyId: savedSurvey.id,
          }),
        );

        await queryRunner.manager.save(Question, questions);
      }

      await queryRunner.commitTransaction();

      return this.findOne(savedSurvey.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filterDto: SurveyFilterDto): Promise<Survey[]> {
    const query = this.surveyRepository.createQueryBuilder('survey')
      .leftJoinAndSelect('survey.questions', 'questions')
      .leftJoinAndSelect('survey.createdBy', 'createdBy')
      .orderBy('survey.createdAt', 'DESC')
      .addOrderBy('questions.order', 'ASC');

    if (filterDto.status) {
      query.andWhere('survey.status = :status', { status: filterDto.status });
    }

    if (filterDto.search) {
      query.andWhere(
        '(survey.title ILIKE :search OR survey.description ILIKE :search)',
        { search: `%${filterDto.search}%` },
      );
    }

    if (filterDto.createdBy) {
      query.andWhere('survey.createdBy.id = :createdBy', { createdBy: filterDto.createdBy });
    }

    if (filterDto.createdFrom) {
      query.andWhere('survey.createdAt >= :createdFrom', { createdFrom: filterDto.createdFrom });
    }

    if (filterDto.createdTo) {
      query.andWhere('survey.createdAt <= :createdTo', { createdTo: filterDto.createdTo });
    }

    if (filterDto.activeOnly) {
      const now = new Date();
      query.andWhere('survey.status = :status', { status: 'published' });
      query.andWhere(
        '(survey.settings->>\'startDate\' IS NULL OR (survey.settings->>\'startDate\')::timestamp <= :now)',
        { now },
      );
      query.andWhere(
        '(survey.settings->>\'endDate\' IS NULL OR (survey.settings->>\'endDate\')::timestamp >= :now)',
        { now },
      );
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Survey> {
    const survey = await this.surveyRepository.findOne({
      where: { id },
      relations: ['questions', 'createdBy'],
      order: {
        questions: {
          order: 'ASC',
        },
      },
    });

    if (!survey) {
      throw new NotFoundException(`Survey with ID ${id} not found`);
    }

    return survey;
  }

  async findBySlug(slug: string): Promise<Survey> {
    const survey = await this.surveyRepository.findOne({
      where: { slug },
      relations: ['questions'],
      order: {
        questions: {
          order: 'ASC',
        },
      },
    });

    if (!survey) {
      throw new NotFoundException(`Survey with slug ${slug} not found`);
    }

    // Only return published surveys for public access
    if (survey.status !== 'published') {
      throw new NotFoundException(`Survey not available`);
    }

    // Check if survey is within valid date range
    const now = new Date();
    if (survey.settings?.startDate && new Date(survey.settings.startDate) > now) {
      throw new BadRequestException('Survey has not started yet');
    }
    if (survey.settings?.endDate && new Date(survey.settings.endDate) < now) {
      throw new BadRequestException('Survey has ended');
    }

    return survey;
  }

  async update(id: string, updateSurveyDto: UpdateSurveyDto): Promise<Survey> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const survey = await this.findOne(id);

      // Update survey details
      const { questions, ...surveyData } = updateSurveyDto;
      Object.assign(survey, surveyData);
      
      await queryRunner.manager.save(Survey, survey);

      // Update questions if provided
      if (questions) {
        // Delete existing questions
        await queryRunner.manager.delete(Question, { surveyId: id });

        // Create new questions
        const newQuestions = questions.map((q) =>
          queryRunner.manager.create(Question, {
            ...q,
            surveyId: id,
          }),
        );

        await queryRunner.manager.save(Question, newQuestions);
      }

      await queryRunner.commitTransaction();

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const survey = await this.findOne(id);

    // Check if survey has responses
    const responseCount = await this.responseRepository.count({
      where: { surveyId: id },
    });

    if (responseCount > 0) {
      throw new ConflictException('Cannot delete survey with existing responses');
    }

    await this.surveyRepository.remove(survey);
  }

  async getSurveyStatistics(id: string): Promise<any> {
    const survey = await this.findOne(id);

    const totalResponses = await this.responseRepository.count({
      where: { surveyId: id, status: 'submitted' },
    });

    const questionStats = await this.dataSource.query(`
      SELECT 
        q.id,
        q.label,
        q.type,
        COUNT(DISTINCT a.response_id) as response_count,
        CASE 
          WHEN q.type IN ('select', 'radio', 'checkbox') THEN
            json_agg(
              json_build_object(
                'value', a.answer,
                'count', COUNT(*)
              )
            )
          ELSE NULL
        END as value_distribution
      FROM questions q
      LEFT JOIN answers a ON a.question_id = q.id
      LEFT JOIN survey_responses r ON r.id = a.response_id AND r.status = 'submitted'
      WHERE q.survey_id = $1
      GROUP BY q.id, q.label, q.type
      ORDER BY q.order
    `, [id]);

    return {
      survey: {
        id: survey.id,
        title: survey.title,
        totalQuestions: survey.questions.length,
      },
      totalResponses,
      questionStats,
    };
  }
}
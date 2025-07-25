import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SurveyResponse, Answer, Survey, Question } from '../entities';
import { SubmitResponseDto, SaveDraftResponseDto } from './dto/submit-response.dto';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
const { parse } = require('json2csv');

@Injectable()
export class SurveyResponsesService {
  constructor(
    @InjectRepository(SurveyResponse)
    private responseRepository: Repository<SurveyResponse>,
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    private dataSource: DataSource,
  ) {}

  async submitResponse(
    surveyId: string,
    submitDto: SubmitResponseDto,
    userId?: string,
  ): Promise<SurveyResponse> {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId },
      relations: ['questions'],
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    if (survey.status !== 'published') {
      throw new BadRequestException('Survey is not accepting responses');
    }

    // Check date constraints
    const now = new Date();
    if (survey.settings?.startDate && new Date(survey.settings.startDate) > now) {
      throw new BadRequestException('Survey has not started yet');
    }
    if (survey.settings?.endDate && new Date(survey.settings.endDate) < now) {
      throw new BadRequestException('Survey has ended');
    }

    // Check multiple submissions
    if (!survey.settings?.allowMultipleSubmissions && userId) {
      const existingResponse = await this.responseRepository.findOne({
        where: {
          surveyId,
          userId,
          status: 'submitted',
        },
      });

      if (existingResponse) {
        throw new BadRequestException('You have already submitted a response to this survey');
      }
    }

    // Validate required questions
    await this.validateResponses(survey, submitDto.answers);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create response
      const response = queryRunner.manager.create(SurveyResponse, {
        surveyId,
        userId,
        uuid: uuidv4(),
        status: 'submitted',
        submittedAt: new Date(),
        metadata: submitDto.metadata,
      });

      const savedResponse = await queryRunner.manager.save(SurveyResponse, response);

      // Save answers
      const answers = submitDto.answers.map((answer) =>
        queryRunner.manager.create(Answer, {
          responseId: savedResponse.id,
          questionId: answer.questionId,
          answer: answer.answer,
          files: answer.files,
        }),
      );

      await queryRunner.manager.save(Answer, answers);

      await queryRunner.commitTransaction();

      return this.findResponseById(savedResponse.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async saveDraft(
    surveyId: string,
    draftDto: SaveDraftResponseDto,
    userId?: string,
  ): Promise<SurveyResponse> {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId },
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let response: SurveyResponse;

      if (draftDto.responseId) {
        // Update existing draft
        response = await this.responseRepository.findOne({
          where: { id: draftDto.responseId, status: 'draft' },
        });

        if (!response) {
          throw new NotFoundException('Draft response not found');
        }

        // Delete existing answers
        await queryRunner.manager.delete(Answer, { responseId: response.id });
      } else {
        // Create new draft
        response = queryRunner.manager.create(SurveyResponse, {
          surveyId,
          userId,
          uuid: uuidv4(),
          status: 'draft',
          metadata: draftDto.metadata,
        });

        response = await queryRunner.manager.save(SurveyResponse, response);
      }

      // Save new answers
      const answers = draftDto.answers.map((answer) =>
        queryRunner.manager.create(Answer, {
          responseId: response.id,
          questionId: answer.questionId,
          answer: answer.answer,
          files: answer.files,
        }),
      );

      await queryRunner.manager.save(Answer, answers);

      await queryRunner.commitTransaction();

      return this.findResponseById(response.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findResponseById(id: string): Promise<SurveyResponse> {
    const response = await this.responseRepository.findOne({
      where: { id },
      relations: ['survey', 'answers', 'answers.question'],
    });

    if (!response) {
      throw new NotFoundException('Response not found');
    }

    return response;
  }

  async findResponseByUuid(uuid: string): Promise<SurveyResponse> {
    const response = await this.responseRepository.findOne({
      where: { uuid },
      relations: ['survey', 'answers', 'answers.question'],
    });

    if (!response) {
      throw new NotFoundException('Response not found');
    }

    return response;
  }

  async exportResponses(surveyId: string, format: 'csv' | 'json' = 'csv'): Promise<any> {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId },
      relations: ['questions'],
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    const responses = await this.responseRepository.find({
      where: { surveyId, status: 'submitted' },
      relations: ['answers', 'user'],
      order: { submittedAt: 'DESC' },
    });

    if (format === 'json') {
      return {
        survey: {
          id: survey.id,
          title: survey.title,
          questions: survey.questions.map((q) => ({
            id: q.id,
            label: q.label,
            type: q.type,
          })),
        },
        responses: responses.map((r) => ({
          id: r.id,
          uuid: r.uuid,
          userId: r.userId,
          submittedAt: r.submittedAt,
          answers: r.answers.reduce((acc, answer) => {
            acc[answer.questionId] = answer.answer;
            return acc;
          }, {}),
        })),
      };
    }

    // CSV export
    const headers = ['Response ID', 'User ID', 'Submitted At'];
    const questionMap = new Map();

    survey.questions.forEach((q) => {
      headers.push(q.label);
      questionMap.set(q.id, q.label);
    });

    const rows = responses.map((response) => {
      const row = {
        'Response ID': response.uuid,
        'User ID': response.userId || 'Anonymous',
        'Submitted At': response.submittedAt.toISOString(),
      };

      // Initialize all questions with empty values
      survey.questions.forEach((q) => {
        row[q.label] = '';
      });

      // Fill in the answers
      response.answers.forEach((answer) => {
        const questionLabel = questionMap.get(answer.questionId);
        if (questionLabel) {
          row[questionLabel] = this.formatAnswerForCsv(answer.answer);
        }
      });

      return row;
    });

    return parse(rows, { fields: headers });
  }

  private async validateResponses(survey: Survey, answers: any[]): Promise<void> {
    const answerMap = new Map(answers.map((a) => [a.questionId, a]));

    for (const question of survey.questions) {
      const answer = answerMap.get(question.id);

      // Check required fields
      if (question.required && (!answer || answer.answer === null || answer.answer === '')) {
        throw new BadRequestException(`Question "${question.label}" is required`);
      }

      // Validate based on question type
      if (answer && answer.answer !== null && answer.answer !== '') {
        await this.validateAnswer(question, answer.answer);
      }
    }
  }

  private async validateAnswer(question: Question, answer: any): Promise<void> {
    const validation = question.validation;

    switch (question.type) {
      case 'number':
        if (typeof answer !== 'number') {
          throw new BadRequestException(`Invalid number for question "${question.label}"`);
        }
        if (validation?.min !== undefined && answer < validation.min) {
          throw new BadRequestException(`Value must be at least ${validation.min}`);
        }
        if (validation?.max !== undefined && answer > validation.max) {
          throw new BadRequestException(`Value must be at most ${validation.max}`);
        }
        break;

      case 'text':
      case 'textarea':
        if (typeof answer !== 'string') {
          throw new BadRequestException(`Invalid text for question "${question.label}"`);
        }
        if (validation?.minLength && answer.length < validation.minLength) {
          throw new BadRequestException(`Text must be at least ${validation.minLength} characters`);
        }
        if (validation?.maxLength && answer.length > validation.maxLength) {
          throw new BadRequestException(`Text must be at most ${validation.maxLength} characters`);
        }
        if (validation?.pattern && !new RegExp(validation.pattern).test(answer)) {
          throw new BadRequestException(`Invalid format for question "${question.label}"`);
        }
        break;

      case 'select':
      case 'radio':
        if (!question.options?.some((opt) => opt.value === answer)) {
          throw new BadRequestException(`Invalid option for question "${question.label}"`);
        }
        break;

      case 'checkbox':
        if (!Array.isArray(answer)) {
          throw new BadRequestException(`Invalid selection for question "${question.label}"`);
        }
        for (const value of answer) {
          if (!question.options?.some((opt) => opt.value === value)) {
            throw new BadRequestException(`Invalid option for question "${question.label}"`);
          }
        }
        break;

      case 'date':
      case 'time':
        if (!this.isValidDate(answer)) {
          throw new BadRequestException(`Invalid date/time for question "${question.label}"`);
        }
        break;

      case 'location':
        if (!answer.latitude || !answer.longitude) {
          throw new BadRequestException(`Invalid location for question "${question.label}"`);
        }
        break;
    }
  }

  private isValidDate(value: any): boolean {
    return !isNaN(Date.parse(value));
  }

  private formatAnswerForCsv(answer: any): string {
    if (answer === null || answer === undefined) {
      return '';
    }
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    if (typeof answer === 'object') {
      return JSON.stringify(answer);
    }
    return String(answer);
  }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObservationKhmerForm } from '../../entities/observation-khmer.entity';

@Injectable()
export class ObservationKhmerService {
  constructor(
    @InjectRepository(ObservationKhmerForm)
    private observationKhmerRepository: Repository<ObservationKhmerForm>,
  ) {}

  async create(data: Partial<ObservationKhmerForm>, userId: string): Promise<ObservationKhmerForm> {
    const observation = this.observationKhmerRepository.create({
      ...data,
      createdById: userId,
    });
    return await this.observationKhmerRepository.save(observation);
  }

  async findAll(userId: string): Promise<ObservationKhmerForm[]> {
    return await this.observationKhmerRepository.find({
      where: { createdById: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ObservationKhmerForm> {
    return await this.observationKhmerRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });
  }

  async update(id: string, data: Partial<ObservationKhmerForm>): Promise<ObservationKhmerForm> {
    await this.observationKhmerRepository.update(id, data);
    return await this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.observationKhmerRepository.delete(id);
  }
}
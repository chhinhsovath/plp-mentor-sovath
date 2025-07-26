import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObservationKhmerForm } from '../../entities/observation-khmer.entity';
import { ObservationKhmerService } from './observation-khmer.service';
import { ObservationKhmerController } from './observation-khmer.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ObservationKhmerForm])],
  controllers: [ObservationKhmerController],
  providers: [ObservationKhmerService],
  exports: [ObservationKhmerService],
})
export class ObservationKhmerModule {}
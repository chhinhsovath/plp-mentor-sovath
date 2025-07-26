import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ObservationKhmerService } from './observation-khmer.service';
import { ObservationKhmerForm } from '../../entities/observation-khmer.entity';

@ApiTags('observation-khmer')
@Controller('api/observation-khmer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ObservationKhmerController {
  constructor(private readonly observationKhmerService: ObservationKhmerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Khmer observation form' })
  async create(@Body() data: Partial<ObservationKhmerForm>, @Request() req) {
    return await this.observationKhmerService.create(data, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Khmer observation forms for current user' })
  async findAll(@Request() req) {
    return await this.observationKhmerService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific Khmer observation form' })
  async findOne(@Param('id') id: string) {
    return await this.observationKhmerService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a Khmer observation form' })
  async update(@Param('id') id: string, @Body() data: Partial<ObservationKhmerForm>) {
    return await this.observationKhmerService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Khmer observation form' })
  async delete(@Param('id') id: string) {
    await this.observationKhmerService.delete(id);
    return { message: 'Form deleted successfully' };
  }
}
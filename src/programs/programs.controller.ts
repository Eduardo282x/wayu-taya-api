import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsDTO } from './programs.dto';

@Controller('programas')
export class ProgramsController {
  constructor(private programsService: ProgramsService) {}
  @Get()
  async getPrograms() {
    return await this.programsService.getPrograms();
  }

  @Post()
  async createProgram(@Body() data: ProgramsDTO) {
    return await this.programsService.createPrograms(data);
  }

  @Put('/:id')
  async updateProgram(
    @Param('id') programId: string,
    @Body() data: ProgramsDTO,
  ) {
    return await this.programsService.updatePrograms(Number(programId), data);
  }

  @Delete('/:id')
  async deleteProgram(@Param('id') programId: string) {
    return await this.programsService.deletePrograms(Number(programId));
  }
}

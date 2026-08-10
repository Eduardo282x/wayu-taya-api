import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { PeopleService } from './people.service';
import { PeopleDTO, PersonProgramDTO } from './people.dto';

@Controller('people')
export class PeopleController {
  constructor(private peopleService: PeopleService) {}

  @Get()
  async getPeople() {
    return await this.peopleService.getPeople();
  }

  @Get('/program/:id')
  async getPeopleByProgram(@Param('id') id: string) {
    return await this.peopleService.getPeopleByProgram(Number(id));
  }

  @Post()
  async createPeople(@Body() data: PersonProgramDTO) {
    return await this.peopleService.createPeople(data);
  }

  @Post('/normal')
  async createPersonWithoutProgram(@Body() data: PeopleDTO) {
    return await this.peopleService.createPersonWithoutProgram(data);
  }

  @Put('/normal/:id')
  async updatePersonWithoutProgram(
    @Param('id') personId: string,
    @Body() data: PeopleDTO,
  ) {
    return await this.peopleService.updatePersonWithoutProgram(
      Number(personId),
      data,
    );
  }

  @Put('/:id')
  async updatePeople(
    @Param('id') personId: string,
    @Body() data: PersonProgramDTO,
  ) {
    return await this.peopleService.updatePeople(Number(personId), data);
  }

  @Delete('/:id')
  async deletePeople(@Param('id') personId: string) {
    return await this.peopleService.deletePeople(Number(personId));
  }
}

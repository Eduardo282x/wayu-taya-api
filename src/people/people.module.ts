import { Module } from '@nestjs/common';
import { PeopleController } from './people.controller';
import { PeopleService } from './people.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [PeopleController],
  providers: [PeopleService, PrismaService],
})
export class PeopleModule {}

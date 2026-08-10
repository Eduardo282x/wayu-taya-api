import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StateDTO } from './state.dto';

@Injectable()
export class StateService {
  constructor(private prismaService: PrismaService) {}

  async getState() {
    const states = await this.prismaService.state.findMany();

    return { states };
  }

  async createState(state: StateDTO) {
    try {
      const stateCreated = await this.prismaService.state.create({
        data: {
          name: state.name,
        },
      });
      return { state: stateCreated, message: 'Estado creado exitosamente.' };
    } catch (err) {
      throw err;
    }
  }

  async updateState(id: number, state: StateDTO) {
    try {
      const stateUpdated = await this.prismaService.state.update({
        data: { name: state.name },
        where: { id },
      });
      return { state: stateUpdated, message: 'Estado actualizado exitosamente.' };
    } catch (err) {
      throw err;
    }
  }

  async deleteState(id: number) {
    try {
      const stateDeleted = await this.prismaService.state.delete({
        where: { id },
      });
      return { state: stateDeleted, message: 'Estado eliminado exitosamente.' };
    } catch (err) {
      throw err;
    }
  }
}

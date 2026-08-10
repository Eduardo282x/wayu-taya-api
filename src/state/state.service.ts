import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StateDTO } from './state.dto';

@Injectable()
export class StateService {
  constructor(private prismaService: PrismaService) {}

  async getState() {
    return await this.prismaService.state.findMany();
  }

  async createState(state: StateDTO) {
    try {
      await this.prismaService.state.create({
        data: {
          name: state.name,
        },
      });
      return { message: 'Estado creado exitosamente.' };
    } catch (err) {
      throw err;
    }
  }

  async updateState(id: number, state: StateDTO) {
    try {
      await this.prismaService.state.update({
        data: { name: state.name },
        where: { id },
      });
      return { message: 'Estado actualizado exitosamente.' };
    } catch (err) {
      throw err;
    }
  }

  async deleteState(id: number) {
    try {
      await this.prismaService.state.delete({
        where: { id },
      });
      return { message: 'Estado eliminado exitosamente.' };
    } catch (err) {
      throw err;
    }
  }
}

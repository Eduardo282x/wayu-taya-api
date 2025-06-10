import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventsDTO } from './events.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class EventsService {

  constructor(private prismaService: PrismaService) {

  }

  async getEvents() {
    return await this.prismaService.events.findMany({
      orderBy: { id: 'asc' },
      where: { deleted: false },
      include: { parish: true, providersEvents: { include: { providers: true } } }
    });
  }

  async getEventsFixed() {
    return await this.prismaService.events.findMany({
      orderBy: { id: 'asc' },
      where: { deleted: false },
      include: { parish: true, providersEvents: { include: { providers: true } } }
    }).then(res =>
      res.map(data => {
        return {
          ...data,
          providersEvents: data.providersEvents.map(pro => pro.providers)
        }
      })
    )
  }

  async createEvent(event: EventsDTO) {
    try {
      const eventCreated = await this.prismaService.events.create({
        data: {
          name: event.name,
          description: event.description,
          address: event.address,
          parishId: event.parishId,
          startDate: event.startDate,
          endDate: event.endDate,
        }
      });
  
      const dataProvidersEvents = event.providersId.map((pro) => ({
        eventId: eventCreated.id,
        providerId: pro
      }));
  
      await this.prismaService.providersEvents.createMany({
        data: dataProvidersEvents
      });
  
      baseResponse.message = 'Events creado exitosamente.';
      return baseResponse;
    } catch (error) {
      badResponse.message = 'Error al crear event.' + error;
      return badResponse;
    }
  }

  async updateEvent(id: number, event: EventsDTO) {
    try {
      await this.prismaService.events.update({
        data: {
          name: event.name,
          description: event.description,
          address: event.address,
          parishId: event.parishId,
          startDate: event.startDate,
          endDate: event.endDate,
        },
        where: { id }
      });
  
      if (event.cambio_proveedores) {
        await this.prismaService.providersEvents.deleteMany({
          where: { eventId: id }
        });
  
        const dataProvidersEvents = event.providersId.map((pro) => ({
          eventId: id,
          providerId: pro
        }));
  
        await this.prismaService.providersEvents.createMany({
          data: dataProvidersEvents
        });
      }
  
      baseResponse.message = 'Event actualizado exitosamente.';
      return baseResponse;
    } catch (error) {
      badResponse.message = 'Error al actualizar el Event. ' + error;
      return badResponse;
    }
  }

  async deleteEvent(id: number) {
    try {
      await this.prismaService.events.update({
        where: { id },
        data: { deleted: true },
      });
      baseResponse.message = 'Event marcado como deleted exitosamente.';
      return baseResponse;
    } catch (error) {
      badResponse.message = 'Error al marcar el event como deleted.' + error;
      return badResponse;
    }
  }



}
//                                  🤡=>🥥
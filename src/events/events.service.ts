import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventsDTO } from './events.dto';

@Injectable()
export class EventsService {
  constructor(private prismaService: PrismaService) {}

  async getEvents() {
    const events = await this.prismaService.events.findMany({
      orderBy: { id: 'asc' },
      where: { deleted: false },
      include: {
        parish: true,
        providersEvents: { include: { providers: true } },
      },
    });

    return { events };
  }

  async getEventsFixed() {
    const events = await this.prismaService.events
      .findMany({
        orderBy: { id: 'asc' },
        where: { deleted: false },
        include: {
          parish: true,
          providersEvents: { include: { providers: true } },
        },
      })
      .then((res) =>
        res.map((data) => {
          return {
            ...data,
            providersEvents: data.providersEvents.map((pro) => pro.providers),
          };
        }),
      );

    return { events };
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
        },
      });

      const dataProvidersEvents = event.providersId.map((pro) => ({
        eventId: eventCreated.id,
        providerId: pro,
      }));

      await this.prismaService.providersEvents.createMany({
        data: dataProvidersEvents,
      });

      return { event: eventCreated, message: 'Evento creado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async updateEvent(id: number, event: EventsDTO) {
    try {
      const eventUpdated = await this.prismaService.events.update({
        data: {
          name: event.name,
          description: event.description,
          address: event.address,
          parishId: event.parishId,
          startDate: event.startDate,
          endDate: event.endDate,
        },
        where: { id },
      });

      if (event.cambio_proveedores) {
        await this.prismaService.providersEvents.deleteMany({
          where: { eventId: id },
        });

        const dataProvidersEvents = event.providersId.map((pro) => ({
          eventId: id,
          providerId: pro,
        }));

        await this.prismaService.providersEvents.createMany({
          data: dataProvidersEvents,
        });
      }

      return { event: eventUpdated, message: 'Evento actualizado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }

  async deleteEvent(id: number) {
    try {
      const eventDeleted = await this.prismaService.events.update({
        where: { id },
        data: { deleted: true },
      });
      return { event: eventDeleted, message: 'Evento marcado como eliminado exitosamente.' };
    } catch (error) {
      throw error;
    }
  }
}

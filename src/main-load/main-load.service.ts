import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  categories,
  forms,
  locations,
  medicine,
  people,
  products,
  programs,
  providerDB,
  providers,
  store,
} from './main-load.data';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class MainLoadService {
  private readonly logger = new Logger(MainLoadService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async seedLocations() {
    for (const loc of locations) {
      // Insertar estado
      const state = await this.prismaService.state.create({
        data: {
          id: loc.id_estado,
          name: loc.estado,
        },
      });

      // Insertar ciudades del estado
      const createdCities = [];
      for (const cityName of loc.ciudades) {
        const city = await this.prismaService.city.create({
          data: {
            name: cityName,
            stateId: state.id,
          },
        });
        createdCities.push(city);
      }

      // Insertar municipios (towns) y parroquias
      for (const municipio of loc.municipios) {
        // Buscar la ciudad correspondiente a este municipio
        // Puede coincidir con el nombre de la capital del municipio
        const matchingCity = createdCities.find(
          (city) => city.name.toLowerCase() === municipio.capital.toLowerCase(),
        );

        if (!matchingCity) {
          console.warn(
            `⚠️ No se encontró ciudad para el municipio ${municipio.municipio} (${municipio.capital})`,
          );
          continue;
        }

        // Insertar municipio como "town"
        const town = await this.prismaService.town.create({
          data: {
            name: municipio.municipio,
            cityId: matchingCity.id,
          },
        });

        // Insertar parroquias
        for (const parishName of municipio.parroquias) {
          await this.prismaService.parish.create({
            data: {
              name: parishName,
              townId: town.id,
            },
          });
        }
      }
    }

    await this.prismaService.role.createMany({
      data: [
        { rol: 'Super Admin' },
        { rol: 'Administrador' },
        { rol: 'Usuarios' },
      ],
    });

    // Passwords aleatorias por usuario: antes eran 'admin' hardcodeado y
    // además compartían UN único salt, lo que anulaba el efecto de la sal.
    // Se registran en el log para poder recuperarlas en desarrollo.
    const seeds = [
      {
        username: 'admin',
        correo: 'admin@wayutaya.local',
        name: 'admin',
        lastName: 'admin',
        rolId: 1,
      },
      {
        username: 'Roger',
        correo: 'roger@gmail.com',
        name: 'Roger',
        lastName: 'Roger',
        rolId: 2,
      },
      {
        username: 'Andreina',
        correo: 'andreina@gmail.com',
        name: 'Andreina',
        lastName: 'Andreina',
        rolId: 2,
      },
    ];

    for (const seed of seeds) {
      const plain = randomSeedPassword();
      const password = await bcrypt.hash(plain, 12);
      this.logger.warn(
        `Usuario seed "${seed.username}" creado. Contraseña temporal: ${plain}`,
      );
      await this.prismaService.users.create({
        data: { ...seed, password },
      });
    }
    await this.prismaService.people.createMany({
      data: people,
    });

    await this.prismaService.programs.createMany({
      data: programs,
    });
    await this.prismaService.forms.createMany({
      data: forms,
    });
    const allProviders = [...providerDB, ...providers];
    await this.prismaService.providers.createMany({
      data: allProviders,
    });
    await this.prismaService.store.createMany({
      data: store,
    });
    await this.prismaService.category.createMany({
      data: categories,
    });

    const medicineAndProducts = [...medicine, ...products];
    await this.prismaService.medicine.createMany({
      data: medicineAndProducts,
    });

    return { message: 'Datos cargadas correctamente.' };
  }
}

/** Contraseña temporal aleatoria para los usuarios seed. */
function randomSeedPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from(randomBytes(12), (b) => chars[b % chars.length]).join('');
}

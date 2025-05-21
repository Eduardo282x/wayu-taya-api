import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { categories, forms, locations, medicine, people, products, programs, providerDB, providers, store } from './main-load.data';

@Injectable()
export class MainLoadService {

    constructor(private readonly prismaService: PrismaService) { }

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
                const matchingCity = createdCities.find(city => city.name.toLowerCase() === municipio.capital.toLowerCase());

                if (!matchingCity) {
                    console.warn(`⚠️ No se encontró ciudad para el municipio ${municipio.municipio} (${municipio.capital})`);
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

        await this.prismaService.people.createMany({
            data: people
        })

        await this.prismaService.programs.createMany({
            data: programs
        })
        await this.prismaService.forms.createMany({
            data: forms
        })
        const allProviders = [...providerDB, ...providers];
        await this.prismaService.providers.createMany({
            data: allProviders
        })
        await this.prismaService.store.createMany({
            data: store
        })
        await this.prismaService.category.createMany({
            data: categories
        })

        const medicineAndProducts = [...medicine, ...products];
        await this.prismaService.medicine.createMany({
            data: medicineAndProducts
        })

        return { message: 'Ubicaciones cargadas correctamente.' };
    }
}

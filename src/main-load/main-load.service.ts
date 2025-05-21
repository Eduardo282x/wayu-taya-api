import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { categories, forms, locations, medicine, people, products, programs, providerDB, providers, store } from './main-load.data';

@Injectable()
export class MainLoadService {

    constructor(private readonly prismaService: PrismaService) { }

    async seedLocations() {
        const dataStates = locations.map(lo => {
            return {
                id: lo.id_estado,
                name: lo.estado
            }
        });

        const dataCities = locations.map(lo => {
            return lo.ciudades.map(ci => {
                return {
                    name: ci,
                    stateId: lo.id_estado
                }
            })
        })

        const dataParish = locations.map(lo => {
            return lo.ciudades.map(ci => {
                return lo.municipios.map(mu => {
                    return mu.parroquias.map(pa => {
                        return {
                            name: pa,
                            townId: 1,
                        }
                    })
                })
            })
        })

        await this.prismaService.state.createMany({
            data: dataStates,
            skipDuplicates: true
        });

        await this.prismaService.city.createMany({
            data: dataCities.flat(),
            skipDuplicates: true
        });

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
